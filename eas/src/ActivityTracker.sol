// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ActivityTracker {
    address public admin;

    // 수료 기준값
    uint256 public minSessionCount; // 최소 세션 참여 횟수

    // 학회원별 데이터 저장소
    mapping(address => uint256) public attendanceCount; // 출석 횟수
    mapping(address => bool) public projectCompleted;    // 프로젝트 완료 여부

    constructor(uint256 _minSessionCount) {
        admin = msg.sender;
        minSessionCount = _minSessionCount;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    function setMinSessionCount(uint256 _minSessionCount) external onlyAdmin {
        minSessionCount = _minSessionCount;
    }

    function syncData(
        address[] calldata users,
        uint256[] calldata counts,
        bool[] calldata projects
    ) external onlyAdmin {
        require(users.length == counts.length && users.length == projects.length, "Length mismatch");
        for (uint i = 0; i < users.length; i++) {
            attendanceCount[users[i]] = counts[i];
            projectCompleted[users[i]] = projects[i];
        }
    }
}
