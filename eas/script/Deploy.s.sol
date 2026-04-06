// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ActivityTracker.sol";
import "../src/HyblockIssuer.sol";
import "../src/HyblockResolver.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        // 1. ActivityTracker 배포 (최소 세션 참여 횟수 설정)
        uint256 minSessionCount = vm.envOr("MIN_SESSION_COUNT", uint256(8));
        ActivityTracker tracker = new ActivityTracker(minSessionCount);
        console.log("minSessionCount:", minSessionCount);
        console.log("ActivityTracker:", address(tracker));

        // 2. HyblockIssuer 배포 (EAS 컨트랙트 주소 필요)
        // Sepolia EAS: 0xC2679fBD37d54388Ce493F1DB75320D236e1815e
        address easAddress = vm.envOr("EAS_ADDRESS", address(0xC2679fBD37d54388Ce493F1DB75320D236e1815e));
        HyblockIssuer issuer = new HyblockIssuer(easAddress);
        console.log("HyblockIssuer:", address(issuer));

        // 3. HyblockResolver 배포
        HyblockResolver resolver = new HyblockResolver(address(tracker), address(issuer));
        console.log("HyblockResolver:", address(resolver));

        vm.stopBroadcast();
    }
}
