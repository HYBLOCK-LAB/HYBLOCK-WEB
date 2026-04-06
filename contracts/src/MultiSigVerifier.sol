// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {HyblockSBT} from "./HyblockSBT.sol";

/// @title MultiSigVerifier
/// @notice K-of-N threshold signature verification for Hyblock SBT minting.
///         Admins sign EIP-712 typed data off-chain; this contract verifies
///         the signatures on-chain and triggers SBT minting on success.
contract MultiSigVerifier is EIP712, Ownable {
    using ECDSA for bytes32;

    error NotAdmin(address signer);
    error InsufficientSignatures(uint256 got, uint256 required);
    error DuplicateOrUnsorted();
    error DeadlineExpired(uint256 deadline);
    error NonceAlreadyUsed(uint256 nonce);
    error InvalidThreshold();
    error AdminAlreadyExists();
    error AdminNotFound();
    error LengthMismatch();

    bytes32 private constant MINT_TYPEHASH = keccak256(
        "MintCertificate(address recipient,string tokenURI,bytes32[] attestationUIDs,uint256 nonce,uint256 deadline)"
    );

    bytes32 private constant BATCH_MINT_TYPEHASH = keccak256(
        "BatchMintCertificate(address[] recipients,string[] tokenURIs,bytes32[][] attestationUIDs,uint256 nonce,uint256 deadline)"
    );

    HyblockSBT public immutable sbt;
    address[] public admins;
    uint256 public threshold;
    mapping(address => bool) public isAdmin;
    mapping(uint256 => bool) public usedNonces;

    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    constructor(
        address[] memory _admins,
        uint256 _threshold,
        HyblockSBT _sbt,
        address initialOwner
    ) EIP712("HyblockVerifier", "1") Ownable(initialOwner) {
        if (_threshold == 0 || _threshold > _admins.length) revert InvalidThreshold();
        sbt = _sbt;
        threshold = _threshold;

        for (uint256 i; i < _admins.length; ++i) {
            admins.push(_admins[i]);
            isAdmin[_admins[i]] = true;
            emit AdminAdded(_admins[i]);
        }
    }

    // ── Single mint ───────────────────────────────────────────────────────

    function mintWithApproval(
        address recipient,
        string calldata tokenURI,
        bytes32[] calldata attestationUIDs,
        uint256 nonce,
        uint256 deadline,
        bytes[] calldata signatures
    ) external returns (uint256 tokenId) {
        _verifyCommon(nonce, deadline, signatures.length);

        bytes32 structHash = keccak256(
            abi.encode(
                MINT_TYPEHASH,
                recipient,
                keccak256(bytes(tokenURI)),
                keccak256(abi.encodePacked(attestationUIDs)),
                nonce,
                deadline
            )
        );
        _verifySignatures(_hashTypedDataV4(structHash), signatures);

        usedNonces[nonce] = true;
        tokenId = sbt.mint(recipient, tokenURI, attestationUIDs);
    }

    // ── Batch mint ────────────────────────────────────────────────────────

    function batchMintWithApproval(
        address[] calldata recipients,
        string[] calldata tokenURIs,
        bytes32[][] calldata attestationUIDs,
        uint256 nonce,
        uint256 deadline,
        bytes[] calldata signatures
    ) external returns (uint256[] memory tokenIds) {
        _verifyCommon(nonce, deadline, signatures.length);

        bytes32 structHash = keccak256(
            abi.encode(
                BATCH_MINT_TYPEHASH,
                keccak256(abi.encodePacked(recipients)),
                _hashStringArray(tokenURIs),
                _hashBytes32ArrayArray(attestationUIDs),
                nonce,
                deadline
            )
        );
        _verifySignatures(_hashTypedDataV4(structHash), signatures);

        usedNonces[nonce] = true;
        tokenIds = sbt.batchMint(recipients, tokenURIs, attestationUIDs);
    }

    // ── Admin management ──────────────────────────────────────────────────

    function addAdmin(address admin) external onlyOwner {
        if (isAdmin[admin]) revert AdminAlreadyExists();
        admins.push(admin);
        isAdmin[admin] = true;
        emit AdminAdded(admin);
    }

    function removeAdmin(address admin) external onlyOwner {
        if (!isAdmin[admin]) revert AdminNotFound();
        isAdmin[admin] = false;

        uint256 len = admins.length;
        for (uint256 i; i < len; ++i) {
            if (admins[i] == admin) {
                admins[i] = admins[len - 1];
                admins.pop();
                break;
            }
        }

        if (threshold > admins.length) {
            threshold = admins.length;
            emit ThresholdUpdated(threshold + 1, threshold);
        }
        emit AdminRemoved(admin);
    }

    function setThreshold(uint256 newThreshold) external onlyOwner {
        if (newThreshold == 0 || newThreshold > admins.length) revert InvalidThreshold();
        uint256 old = threshold;
        threshold = newThreshold;
        emit ThresholdUpdated(old, newThreshold);
    }

    // ── View helpers ──────────────────────────────────────────────────────

    function getAdmins() external view returns (address[] memory) {
        return admins;
    }

    function getMintDigest(
        address recipient,
        string calldata tokenURI,
        bytes32[] calldata attestationUIDs,
        uint256 nonce,
        uint256 deadline
    ) external view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    MINT_TYPEHASH,
                    recipient,
                    keccak256(bytes(tokenURI)),
                    keccak256(abi.encodePacked(attestationUIDs)),
                    nonce,
                    deadline
                )
            )
        );
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // ── Internal ──────────────────────────────────────────────────────────

    function _verifyCommon(uint256 nonce, uint256 deadline, uint256 sigCount) private view {
        if (block.timestamp > deadline) revert DeadlineExpired(deadline);
        if (usedNonces[nonce]) revert NonceAlreadyUsed(nonce);
        if (sigCount < threshold) revert InsufficientSignatures(sigCount, threshold);
    }

    function _verifySignatures(bytes32 digest, bytes[] calldata signatures) private view {
        address prevSigner;
        for (uint256 i; i < signatures.length; ++i) {
            address signer = digest.recover(signatures[i]);
            if (signer <= prevSigner) revert DuplicateOrUnsorted();
            if (!isAdmin[signer]) revert NotAdmin(signer);
            prevSigner = signer;
        }
    }

    function _hashStringArray(string[] calldata arr) private pure returns (bytes32) {
        bytes32[] memory hashes = new bytes32[](arr.length);
        for (uint256 i; i < arr.length; ++i) {
            hashes[i] = keccak256(bytes(arr[i]));
        }
        return keccak256(abi.encodePacked(hashes));
    }

    function _hashBytes32ArrayArray(bytes32[][] calldata arr) private pure returns (bytes32) {
        bytes32[] memory hashes = new bytes32[](arr.length);
        for (uint256 i; i < arr.length; ++i) {
            hashes[i] = keccak256(abi.encodePacked(arr[i]));
        }
        return keccak256(abi.encodePacked(hashes));
    }
}
