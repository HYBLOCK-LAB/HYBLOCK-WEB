// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/ActivityTracker.sol";
import "../src/HyblockResolver.sol";

contract HyblockResolverTest is Test {
    ActivityTracker tracker;
    HyblockResolver resolver;

    address issuer = address(0xBEEF);
    address user   = address(0xCAFE);

    function setUp() public {
        tracker  = new ActivityTracker(8); // 최소 세션 참여 횟수: 8
        resolver = new HyblockResolver(address(tracker), issuer);
    }

    // 일반 활동 기록은 attester가 issuer면 통과
    function test_attest_activity_pass() public {
        Attestation memory a = _makeAttestation(issuer, user, false);
        bool ok = resolver.attest(a, 0);
        assertTrue(ok);
    }

    // minSessionCount 변경 후 수료 조건 반영 확인
    function test_setMinSessionCount() public {
        tracker.setMinSessionCount(5);
        assertEq(tracker.minSessionCount(), 5);

        address[] memory users = new address[](1);
        uint256[] memory counts = new uint256[](1);
        bool[]    memory projs  = new bool[](1);
        users[0] = user; counts[0] = 5; projs[0] = true;
        tracker.syncData(users, counts, projs);

        Attestation memory a = _makeAttestation(issuer, user, true);
        assertTrue(resolver.attest(a, 0));
    }

    // 수료 조건: 출석 8회 + 프로젝트 완료
    function test_attest_graduation_pass() public {
        address[] memory users = new address[](1);
        uint256[] memory counts = new uint256[](1);
        bool[]    memory projs  = new bool[](1);
        users[0] = user; counts[0] = 8; projs[0] = true;
        tracker.syncData(users, counts, projs);

        Attestation memory a = _makeAttestation(issuer, user, true);
        bool ok = resolver.attest(a, 0);
        assertTrue(ok);
    }

    // 수료 조건 미달: 출석 부족
    function test_attest_graduation_fail_attendance() public {
        address[] memory users = new address[](1);
        uint256[] memory counts = new uint256[](1);
        bool[]    memory projs  = new bool[](1);
        users[0] = user; counts[0] = 5; projs[0] = true;
        tracker.syncData(users, counts, projs);

        Attestation memory a = _makeAttestation(issuer, user, true);
        bool ok = resolver.attest(a, 0);
        assertFalse(ok);
    }

    // attester가 issuer가 아니면 거부
    function test_attest_wrong_attester() public {
        Attestation memory a = _makeAttestation(address(0xDEAD), user, false);
        bool ok = resolver.attest(a, 0);
        assertFalse(ok);
    }

    // ---- helpers ----

    function _makeAttestation(
        address attester,
        address wallet,
        bool isGraduated
    ) internal pure returns (Attestation memory) {
        bytes memory data = abi.encode(wallet, bytes32(0), "attendance", "", isGraduated);
        return Attestation({
            uid: bytes32(0),
            schema: bytes32(0),
            time: 0,
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: wallet,
            attester: attester,
            revocable: true,
            data: data,
            value: 0
        });
    }
}
