// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {HyblockSBT} from "../src/HyblockSBT.sol";
import {IERC5192} from "../src/interfaces/IERC5192.sol";

contract HyblockSBTTest is Test {
    HyblockSBT public sbt;

    address owner = makeAddr("owner");
    address verifier = makeAddr("verifier");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    bytes32[] attestationUIDs;

    function setUp() public {
        sbt = new HyblockSBT(owner);

        vm.prank(owner);
        sbt.setVerifier(verifier);

        attestationUIDs.push(bytes32(uint256(1)));
        attestationUIDs.push(bytes32(uint256(2)));
    }

    // ── Minting ───────────────────────────────────────────────────────────

    function test_mint() public {
        vm.prank(verifier);
        uint256 tokenId = sbt.mint(alice, "ipfs://test", attestationUIDs);

        assertEq(tokenId, 0);
        assertEq(sbt.ownerOf(0), alice);
        assertEq(sbt.tokenURI(0), "ipfs://test");
        assertEq(sbt.totalSupply(), 1);

        bytes32[] memory uids = sbt.getAttestationUIDs(0);
        assertEq(uids.length, 2);
        assertEq(uids[0], bytes32(uint256(1)));
    }

    function test_mint_revert_unauthorized() public {
        vm.prank(alice);
        vm.expectRevert(HyblockSBT.Unauthorized.selector);
        sbt.mint(alice, "ipfs://test", attestationUIDs);
    }

    function test_batchMint() public {
        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        string[] memory uris = new string[](2);
        uris[0] = "ipfs://cert1";
        uris[1] = "ipfs://cert2";

        bytes32[][] memory uidArrays = new bytes32[][](2);
        uidArrays[0] = attestationUIDs;
        uidArrays[1] = attestationUIDs;

        vm.prank(verifier);
        uint256[] memory tokenIds = sbt.batchMint(recipients, uris, uidArrays);

        assertEq(tokenIds.length, 2);
        assertEq(sbt.ownerOf(0), alice);
        assertEq(sbt.ownerOf(1), bob);
        assertEq(sbt.totalSupply(), 2);
    }

    function test_batchMint_revert_lengthMismatch() public {
        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        string[] memory uris = new string[](1);
        uris[0] = "ipfs://cert1";

        bytes32[][] memory uidArrays = new bytes32[][](2);
        uidArrays[0] = attestationUIDs;
        uidArrays[1] = attestationUIDs;

        vm.prank(verifier);
        vm.expectRevert(HyblockSBT.LengthMismatch.selector);
        sbt.batchMint(recipients, uris, uidArrays);
    }

    // ── Soulbound (transfer blocking) ─────────────────────────────────────

    function test_transfer_blocked() public {
        vm.prank(verifier);
        sbt.mint(alice, "ipfs://test", attestationUIDs);

        vm.prank(alice);
        vm.expectRevert(HyblockSBT.Soulbound.selector);
        sbt.transferFrom(alice, bob, 0);
    }

    function test_safeTransfer_blocked() public {
        vm.prank(verifier);
        sbt.mint(alice, "ipfs://test", attestationUIDs);

        vm.prank(alice);
        vm.expectRevert(HyblockSBT.Soulbound.selector);
        sbt.safeTransferFrom(alice, bob, 0);
    }

    // ── ERC-5192 ──────────────────────────────────────────────────────────

    function test_locked_returnsTrue() public {
        vm.prank(verifier);
        sbt.mint(alice, "ipfs://test", attestationUIDs);

        assertTrue(sbt.locked(0));
    }

    function test_locked_revert_nonexistent() public {
        vm.expectRevert();
        sbt.locked(999);
    }

    function test_lockedEvent_emitted() public {
        vm.prank(verifier);
        vm.expectEmit(true, false, false, false);
        emit IERC5192.Locked(0);
        sbt.mint(alice, "ipfs://test", attestationUIDs);
    }

    // ── EIP-165 ───────────────────────────────────────────────────────────

    function test_supportsInterface_ERC5192() public view {
        assertTrue(sbt.supportsInterface(type(IERC5192).interfaceId));
    }

    function test_supportsInterface_ERC721() public view {
        // ERC-721 interfaceId: 0x80ac58cd
        assertTrue(sbt.supportsInterface(0x80ac58cd));
    }

    // ── Admin ─────────────────────────────────────────────────────────────

    function test_setVerifier() public {
        address newVerifier = makeAddr("newVerifier");

        vm.prank(owner);
        sbt.setVerifier(newVerifier);

        assertEq(sbt.verifier(), newVerifier);
    }

    function test_setVerifier_revert_nonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        sbt.setVerifier(alice);
    }
}
