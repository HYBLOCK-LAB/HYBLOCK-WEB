// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// EAS 표준 구조체
struct Attestation {
    bytes32 uid; bytes32 schema; uint64 time; uint64 expirationTime; uint64 revocationTime;
    bytes32 refUID; address recipient; address attester; bool revocable; bytes data; uint256 value;
}

interface IActivityTracker {
    function attendanceCount(address user) external view returns (uint256);
    function projectCompleted(address user) external view returns (bool);
    function minSessionCount() external view returns (uint256);
}

contract HyblockResolver {
    IActivityTracker public tracker;
    address public issuer;

    constructor(address _tracker, address _issuer) {
        tracker = IActivityTracker(_tracker);
        issuer = _issuer;
    }

    function attest(Attestation calldata attestation, uint256) external view returns (bool) {
        // 1. 공식 발행기인지 확인
        if (attestation.attester != issuer) return false;

        // 2. 발행하려는 데이터 풀기
        (address wallet, , , bool isGraduated) = abi.decode(
            attestation.data, (address, bytes32, string, bool)
        );

        // 수료증(true) 발급 시, 온체인 활동 데이터와 대조
        if (isGraduated) {
            uint256 count = tracker.attendanceCount(wallet);
            bool done = tracker.projectCompleted(wallet);

            // 수료 조건: 최소 세션 참여 횟수 이상 AND 프로젝트 완료
            return (count >= tracker.minSessionCount() && done);
        }

        return true; // 일반 활동 기록은 무사 통과
    }

    function isPayable() public pure returns (bool) { return false; }
    function revoke(Attestation calldata, uint256) external pure returns (bool) { return true; }
}
