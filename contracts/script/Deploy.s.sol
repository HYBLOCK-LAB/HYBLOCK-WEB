// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {HyblockSBT} from "../src/HyblockSBT.sol";
import {MultiSigVerifier} from "../src/MultiSigVerifier.sol";
import {HyblockResolver} from "../src/HyblockResolver.sol";
import {IEAS} from "@eas/IEAS.sol";

contract Deploy is Script {
    // Sepolia EAS contract
    address constant EAS_SEPOLIA = 0xC2679fBD37d54388Ce493F1DB75320D236e1815e;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        address admin1 = vm.envAddress("ADMIN_1");
        address admin2 = vm.envAddress("ADMIN_2");
        address admin3 = vm.envAddress("ADMIN_3");
        uint256 threshold = vm.envOr("THRESHOLD", uint256(2));

        address[] memory admins = new address[](3);
        admins[0] = admin1;
        admins[1] = admin2;
        admins[2] = admin3;

        vm.startBroadcast(deployerKey);

        // 1. Deploy SBT
        HyblockSBT sbt = new HyblockSBT(deployer);
        console.log("HyblockSBT:", address(sbt));

        // 2. Deploy MultiSigVerifier
        MultiSigVerifier verifier = new MultiSigVerifier(admins, threshold, sbt, deployer);
        console.log("MultiSigVerifier:", address(verifier));

        // 3. Link verifier to SBT
        sbt.setVerifier(address(verifier));
        console.log("Verifier linked to SBT");

        // 4. Deploy Resolver (EAS integration)
        HyblockResolver resolver = new HyblockResolver(IEAS(EAS_SEPOLIA), deployer);
        console.log("HyblockResolver:", address(resolver));

        // 5. Register admins as trusted attesters on resolver
        for (uint256 i; i < admins.length; ++i) {
            resolver.addAttester(admins[i]);
        }
        console.log("Admins registered as trusted attesters");

        vm.stopBroadcast();

        console.log("--- Deployment Summary ---");
        console.log("Network: Sepolia");
        console.log("SBT:", address(sbt));
        console.log("Verifier:", address(verifier));
        console.log("Resolver:", address(resolver));
        console.log("Threshold:", threshold);
        console.log("Admin count:", admins.length);
    }
}
