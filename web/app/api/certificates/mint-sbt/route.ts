import { NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, parseEventLogs } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getWalletSessionMember } from '@/lib/wallet-session';
import { HYBLOCK_SBT_ABI } from '@/lib/eas';
import { getSbtEligibility, saveSbtIssuance } from '@/lib/supabase-certificate';

function getMintConfig() {
  const contractAddress =
    process.env.HYBLOCK_SBT_ADDRESS ??
    process.env.NEXT_PUBLIC_HYBLOCK_SBT_ADDRESS;
  const privateKey =
    process.env.HYBLOCK_SBT_MINTER_PRIVATE_KEY ??
    process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL;
  const chainId = Number(process.env.HYBLOCK_CHAIN_ID ?? '11155111');
  const metadataBaseUri = process.env.HYBLOCK_SBT_METADATA_BASE_URI ?? 'ipfs://pending-hyblock-certificate';

  if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    throw new Error('SBT contract address is not configured. Set HYBLOCK_SBT_ADDRESS in web/.env.local and restart the Next.js dev server.');
  }
  if (!privateKey || !/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    throw new Error('SBT minter private key is not configured. Set HYBLOCK_SBT_MINTER_PRIVATE_KEY in web/.env.local and restart the Next.js dev server.');
  }
  if (!rpcUrl) {
    throw new Error('RPC_URL is not configured. Set RPC_URL in web/.env.local and restart the Next.js dev server.');
  }

  return {
    contractAddress: contractAddress as `0x${string}`,
    privateKey: privateKey as `0x${string}`,
    rpcUrl,
    chainId,
    metadataBaseUri,
  };
}

export async function POST() {
  const member = await getWalletSessionMember();
  if (!member) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const requestedWallet = member.wallet_address?.toLowerCase() ?? '';
    if (!requestedWallet) {
      return NextResponse.json({ error: '현재 로그인 세션에 연결된 지갑 주소가 없습니다.' }, { status: 400 });
    }

    const eligibility = await getSbtEligibility(requestedWallet);
    if (!eligibility.memberId) {
      return NextResponse.json({ error: '회원 정보를 찾지 못했습니다.' }, { status: 404 });
    }
    if (eligibility.alreadyMinted) {
      return NextResponse.json({ error: '이미 수료증이 발급되었습니다.' }, { status: 409 });
    }
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: '필수 증명이 부족합니다.',
          missingTypes: eligibility.missingTypes,
        },
        { status: 400 },
      );
    }

    const config = getMintConfig();
    const account = privateKeyToAccount(config.privateKey);
    const transport = http(config.rpcUrl);
    const walletClient = createWalletClient({
      account,
      transport,
      chain: {
        id: config.chainId,
        name: 'HYBLOCK Configured Chain',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
          default: { http: [config.rpcUrl] },
          public: { http: [config.rpcUrl] },
        },
      },
    });
    const publicClient = createPublicClient({
      transport,
      chain: walletClient.chain,
    });

    const metadataUri = `${config.metadataBaseUri}/${eligibility.memberId}.json`;
    const txHash = await walletClient.writeContract({
      address: config.contractAddress,
      abi: HYBLOCK_SBT_ABI,
      functionName: 'safeMint',
      args: [requestedWallet as `0x${string}`, metadataUri],
      account,
      chain: walletClient.chain,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    const transferLogs = parseEventLogs({
      abi: HYBLOCK_SBT_ABI,
      logs: receipt.logs,
      eventName: 'Transfer',
    });
    const tokenId = transferLogs[0]?.args?.tokenId;

    if (typeof tokenId !== 'bigint') {
      throw new Error('민팅 결과에서 tokenId를 찾지 못했습니다.');
    }

    await saveSbtIssuance({
      memberId: eligibility.memberId,
      tokenId,
      contractAddress: config.contractAddress,
      transactionHash: txHash,
      mintedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      txHash,
      tokenId: tokenId.toString(),
      metadataUri,
    });
  } catch (error) {
    console.error('POST /api/certificates/mint-sbt error:', error);
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    const status =
      message.includes('이미 수료증이 발급') ? 409 :
      message.includes('필수 증명이 부족') ? 400 :
      500;

    return NextResponse.json({ error: message }, { status });
  }
}
