// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC5192} from "./interfaces/IERC5192.sol";

/// @title HyblockSBT
/// @notice Soulbound Token (ERC-721 + ERC-5192) for Hyblock club certificates.
///         All tokens are permanently locked and non-transferable after minting.
contract HyblockSBT is ERC721, ERC721URIStorage, IERC5192, Ownable {
    error Soulbound();
    error Unauthorized();
    error TokenNotFound();
    error LengthMismatch();

    uint256 private _nextTokenId;
    address public verifier;

    // tokenId => EAS attestation UIDs used for this certificate
    mapping(uint256 => bytes32[]) private _tokenAttestationUIDs;

    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    event CertificateMinted(uint256 indexed tokenId, address indexed recipient, bytes32[] attestationUIDs);

    modifier onlyVerifier() {
        if (msg.sender != verifier) revert Unauthorized();
        _;
    }

    constructor(address initialOwner) ERC721("Hyblock Certificate", "HCERT") Ownable(initialOwner) {}

    // ── Admin ─────────────────────────────────────────────────────────────

    function setVerifier(address newVerifier) external onlyOwner {
        address old = verifier;
        verifier = newVerifier;
        emit VerifierUpdated(old, newVerifier);
    }

    // ── Minting (verifier only) ───────────────────────────────────────────

    function mint(
        address to,
        string calldata uri,
        bytes32[] calldata attestationUIDs
    ) external onlyVerifier returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _tokenAttestationUIDs[tokenId] = attestationUIDs;

        emit Locked(tokenId);
        emit CertificateMinted(tokenId, to, attestationUIDs);
    }

    function batchMint(
        address[] calldata recipients,
        string[] calldata uris,
        bytes32[][] calldata attestationUIDs
    ) external onlyVerifier returns (uint256[] memory tokenIds) {
        uint256 len = recipients.length;
        if (len != uris.length || len != attestationUIDs.length) revert LengthMismatch();

        tokenIds = new uint256[](len);
        for (uint256 i; i < len; ++i) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, uris[i]);
            _tokenAttestationUIDs[tokenId] = attestationUIDs[i];

            emit Locked(tokenId);
            emit CertificateMinted(tokenId, recipients[i], attestationUIDs[i]);
            tokenIds[i] = tokenId;
        }
    }

    // ── View ──────────────────────────────────────────────────────────────

    function getAttestationUIDs(uint256 tokenId) external view returns (bytes32[] memory) {
        _requireOwned(tokenId);
        return _tokenAttestationUIDs[tokenId];
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    // ── ERC-5192: Soulbound ───────────────────────────────────────────────

    function locked(uint256 tokenId) external view override returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    // ── Transfer blocking ─────────────────────────────────────────────────

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // Allow minting (from == address(0)), block all transfers
        if (from != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }

    // ── ERC-721 overrides ─────────────────────────────────────────────────

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }
}
