// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {HyblockSBT} from "../src/HyblockSBT.sol";
import {MultiSigVerifier} from "../src/MultiSigVerifier.sol";

contract MultiSigVerifierTest is Test {
    HyblockSBT public sbt;
    MultiSigVerifier public verifier;

    // Admin keys (sorted by address ascending for signature ordering)
    uint256 admin1Key;
    uint256 admin2Key;
    uint256 admin3Key;
    address admin1;
    address admin2;
    address admin3;

    address owner = makeAddr("owner");
    address alice = makeAddr("alice");

    bytes32[] attestationUIDs;

    function setUp() public {
        // Generate deterministic keys and sort by address
        (address a1, uint256 k1) = makeAddrAndKey("admin1");
        (address a2, uint256 k2) = makeAddrAndKey("admin2");
        (address a3, uint256 k3) = makeAddrAndKey("admin3");

        // Sort admins by address (required for signature verification)
        address[] memory sorted = new address[](3);
        uint256[] memory keys = new uint256[](3);
        sorted[0] = a1; keys[0] = k1;
        sorted[1] = a2; keys[1] = k2;
        sorted[2] = a3; keys[2] = k3;
        _sortByAddress(sorted, keys);

        admin1 = sorted[0]; admin1Key = keys[0];
        admin2 = sorted[1]; admin2Key = keys[1];
        admin3 = sorted[2]; admin3Key = keys[2];

        address[] memory admins = new address[](3);
        admins[0] = admin1;
        admins[1] = admin2;
        admins[2] = admin3;

        sbt = new HyblockSBT(owner);

        verifier = new MultiSigVerifier(admins, 2, sbt, owner);

        vm.prank(owner);
        sbt.setVerifier(address(verifier));

        attestationUIDs.push(bytes32(uint256(100)));
        attestationUIDs.push(bytes32(uint256(200)));
    }

    // ── Successful mint ───────────────────────────────────────────────────

    function test_mintWithApproval_2of3() public {
        uint256 nonce = 1;
        uint256 deadline = block.timestamp + 1 hours;
        string memory uri = "ipfs://cert-alice";

        bytes32 digest = verifier.getMintDigest(alice, uri, attestationUIDs, nonce, deadline);

        // Sign with admin1 and admin2 (2-of-3, sorted ascending)
        bytes[] memory sigs = new bytes[](2);
        sigs[0] = _sign(admin1Key, digest);
        sigs[1] = _sign(admin2Key, digest);

        uint256 tokenId = verifier.mintWithApproval(
            alice, uri, attestationUIDs, nonce, deadline, sigs
        );

        assertEq(tokenId, 0);
        assertEq(sbt.ownerOf(0), alice);
        assertEq(sbt.tokenURI(0), "ipfs://cert-alice");
    }

    function test_mintWithApproval_3of3() public {
        uint256 nonce = 1;
        uint256 deadline = block.timestamp + 1 hours;
        string memory uri = "ipfs://cert-alice";

        bytes32 digest = verifier.getMintDigest(alice, uri, attestationUIDs, nonce, deadline);

        bytes[] memory sigs = new bytes[](3);
        sigs[0] = _sign(admin1Key, digest);
        sigs[1] = _sign(admin2Key, digest);
        sigs[2] = _sign(admin3Key, digest);

        uint256 tokenId = verifier.mintWithApproval(
            alice, uri, attestationUIDs, nonce, deadline, sigs
        );

        assertEq(tokenId, 0);
    }

    // ── Signature failures ────────────────────────────────────────────────

    function test_revert_insufficientSignatures() public {
        uint256 nonce = 1;
        uint256 deadline = block.timestamp + 1 hours;
        string memory uri = "ipfs://cert-alice";

        bytes32 digest = verifier.getMintDigest(alice, uri, attestationUIDs, nonce, deadline);

        bytes[] memory sigs = new bytes[](1);
        sigs[0] = _sign(admin1Key, digest);

        vm.expectRevert(
            abi.encodeWithSelector(MultiSigVerifier.InsufficientSignatures.selector, 1, 2)
        );
        verifier.mintWithApproval(alice, uri, attestationUIDs, nonce, deadline, sigs);
    }

    function test_revert_duplicateSignatures() public {
        uint256 nonce = 1;
        uint256 deadline = block.timestamp + 1 hours;
        string memory uri = "ipfs://cert-alice";

        bytes32 digest = verifier.getMintDigest(alice, uri, attestationUIDs, nonce, deadline);

        // Same signer twice — will fail on duplicate/unsorted check
        bytes[] memory sigs = new bytes[](2);
        sigs[0] = _sign(admin1Key, digest);
        sigs[1] = _sign(admin1Key, digest);

        vm.expectRevert(MultiSigVerifier.DuplicateOrUnsorted.selector);
        verifier.mintWithApproval(alice, uri, attestationUIDs, nonce, deadline, sigs);
    }

    function test_revert_unsortedSignatures() public {
        uint256 nonce = 1;
        uint256 deadline = block.timestamp + 1 hours;
        string memory uri = "ipfs://cert-alice";

        bytes32 digest = verifier.getMintDigest(alice, uri, attestationUIDs, nonce, deadline);

        // Reversed order (admin2 before admin1 — descending)
        bytes[] memory sigs = new bytes[](2);
        sigs[0] = _sign(admin2Key, digest);
        sigs[1] = _sign(admin1Key, digest);

        vm.expectRevert(MultiSigVerifier.DuplicateOrUnsorted.selector);
        verifier.mintWithApproval(alice, uri, attestationUIDs, nonce, deadline, sigs);
    }

    function test_revert_nonAdminSigner() public {
        uint256 nonce = 1;
        uint256 deadline = block.timestamp + 1 hours;
        string memory uri = "ipfs://cert-alice";

        (address fakeAdmin, uint256 fakeKey) = makeAddrAndKey("fake");

        bytes32 digest = verifier.getMintDigest(alice, uri, attestationUIDs, nonce, deadline);

        bytes[] memory sigs = new bytes[](2);
        // Sort by address
        if (admin1 < fakeAdmin) {
            sigs[0] = _sign(admin1Key, digest);
            sigs[1] = _sign(fakeKey, digest);
        } else {
            sigs[0] = _sign(fakeKey, digest);
            sigs[1] = _sign(admin1Key, digest);
        }

        vm.expectRevert(abi.encodeWithSelector(MultiSigVerifier.NotAdmin.selector, fakeAdmin));
        verifier.mintWithApproval(alice, uri, attestationUIDs, nonce, deadline, sigs);
    }

    // ── Replay protection ─────────────────────────────────────────────────

    function test_revert_nonceReuse() public {
        uint256 nonce = 1;
        uint256 deadline = block.timestamp + 1 hours;
        string memory uri = "ipfs://cert-alice";

        bytes32 digest = verifier.getMintDigest(alice, uri, attestationUIDs, nonce, deadline);

        bytes[] memory sigs = new bytes[](2);
        sigs[0] = _sign(admin1Key, digest);
        sigs[1] = _sign(admin2Key, digest);

        verifier.mintWithApproval(alice, uri, attestationUIDs, nonce, deadline, sigs);

        // Same nonce again
        vm.expectRevert(abi.encodeWithSelector(MultiSigVerifier.NonceAlreadyUsed.selector, nonce));
        verifier.mintWithApproval(alice, uri, attestationUIDs, nonce, deadline, sigs);
    }

    function test_revert_expiredDeadline() public {
        uint256 nonce = 1;
        uint256 deadline = block.timestamp - 1; // already expired
        string memory uri = "ipfs://cert-alice";

        bytes32 digest = verifier.getMintDigest(alice, uri, attestationUIDs, nonce, deadline);

        bytes[] memory sigs = new bytes[](2);
        sigs[0] = _sign(admin1Key, digest);
        sigs[1] = _sign(admin2Key, digest);

        vm.expectRevert(abi.encodeWithSelector(MultiSigVerifier.DeadlineExpired.selector, deadline));
        verifier.mintWithApproval(alice, uri, attestationUIDs, nonce, deadline, sigs);
    }

    // ── Admin management ──────────────────────────────────────────────────

    function test_addAdmin() public {
        address newAdmin = makeAddr("newAdmin");

        vm.prank(owner);
        verifier.addAdmin(newAdmin);

        assertTrue(verifier.isAdmin(newAdmin));
        assertEq(verifier.getAdmins().length, 4);
    }

    function test_removeAdmin() public {
        vm.prank(owner);
        verifier.removeAdmin(admin3);

        assertFalse(verifier.isAdmin(admin3));
        assertEq(verifier.getAdmins().length, 2);
    }

    function test_removeAdmin_adjustsThreshold() public {
        // threshold = 2, admins = 3
        // Remove 2 admins -> threshold should be capped at 1
        vm.startPrank(owner);
        verifier.removeAdmin(admin3);
        verifier.removeAdmin(admin2);
        vm.stopPrank();

        assertEq(verifier.threshold(), 1);
    }

    function test_setThreshold() public {
        vm.prank(owner);
        verifier.setThreshold(3);
        assertEq(verifier.threshold(), 3);
    }

    function test_revert_invalidThreshold() public {
        vm.prank(owner);
        vm.expectRevert(MultiSigVerifier.InvalidThreshold.selector);
        verifier.setThreshold(0);

        vm.prank(owner);
        vm.expectRevert(MultiSigVerifier.InvalidThreshold.selector);
        verifier.setThreshold(4); // more than admin count
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    function _sign(uint256 privateKey, bytes32 digest) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _sortByAddress(address[] memory addrs, uint256[] memory keys) internal pure {
        uint256 n = addrs.length;
        for (uint256 i; i < n; ++i) {
            for (uint256 j = i + 1; j < n; ++j) {
                if (addrs[i] > addrs[j]) {
                    (addrs[i], addrs[j]) = (addrs[j], addrs[i]);
                    (keys[i], keys[j]) = (keys[j], keys[i]);
                }
            }
        }
    }
}
