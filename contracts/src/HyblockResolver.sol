// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {SchemaResolver} from "@eas/resolver/SchemaResolver.sol";
import {IEAS, Attestation} from "@eas/IEAS.sol";

/// @title HyblockResolver
/// @notice EAS Schema Resolver that restricts attestation creation
///         to trusted attester addresses registered by the owner.
contract HyblockResolver is SchemaResolver {
    error OnlyOwner();
    error AttesterAlreadyTrusted();
    error AttesterNotTrusted();

    address public owner;
    mapping(address => bool) public trustedAttesters;

    event AttesterAdded(address indexed attester);
    event AttesterRemoved(address indexed attester);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(IEAS eas, address _owner) SchemaResolver(eas) {
        owner = _owner;
    }

    // ── Admin ─────────────────────────────────────────────────────────────

    function addAttester(address attester) external onlyOwner {
        if (trustedAttesters[attester]) revert AttesterAlreadyTrusted();
        trustedAttesters[attester] = true;
        emit AttesterAdded(attester);
    }

    function removeAttester(address attester) external onlyOwner {
        if (!trustedAttesters[attester]) revert AttesterNotTrusted();
        trustedAttesters[attester] = false;
        emit AttesterRemoved(attester);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        address prev = owner;
        owner = newOwner;
        emit OwnershipTransferred(prev, newOwner);
    }

    // ── Resolver callbacks ────────────────────────────────────────────────

    function onAttest(
        Attestation calldata attestation,
        uint256 /* value */
    ) internal view override returns (bool) {
        return trustedAttesters[attestation.attester];
    }

    function onRevoke(
        Attestation calldata, /* attestation */
        uint256 /* value */
    ) internal pure override returns (bool) {
        return true;
    }
}
