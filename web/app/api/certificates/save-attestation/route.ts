import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAccess } from '@/lib/admin-auth';
import { saveAttestation } from '@/lib/supabase-certificate';

type SaveAttestationBody = {
  wallet_address: string;
  attestation_type: string;
  eas_uid: string;
  personal_data_hash: string;
  revealed_data: Record<string, unknown>;
  is_graduated?: boolean;
};

export async function POST(request: NextRequest) {
  const auth = await requireAdminApiAccess();
  if (auth.response) return auth.response;

  let body: SaveAttestationBody;

  try {
    body = (await request.json()) as SaveAttestationBody;
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  const { wallet_address, attestation_type, eas_uid, personal_data_hash, revealed_data } = body;

  if (!wallet_address || !attestation_type || !eas_uid || !personal_data_hash) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
  }

  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet_address)) {
    return NextResponse.json({ error: '유효하지 않은 지갑 주소입니다.' }, { status: 400 });
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(eas_uid)) {
    return NextResponse.json({ error: '유효하지 않은 EAS UID 형식입니다.' }, { status: 400 });
  }

  try {
    await saveAttestation({
      wallet_address,
      attestation_type,
      eas_uid,
      personal_data_hash,
      revealed_data: revealed_data ?? {},
      is_graduated: body.is_graduated ?? false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/certificates/save-attestation error:', error);
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    const isDuplicate = message.includes('unique') || message.includes('duplicate');
    return NextResponse.json(
      { error: isDuplicate ? '이미 발급된 증명서입니다.' : '증명 저장에 실패했습니다.' },
      { status: isDuplicate ? 409 : 500 },
    );
  }
}
