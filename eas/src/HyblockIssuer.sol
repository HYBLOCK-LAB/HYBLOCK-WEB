// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEAS {
    struct AttestationRequestData {
        address recipient;
        uint64 expirationTime;
        bool revocable;
        bytes32 refUID;
        bytes data;
        uint256 value;
    }
    struct AttestationRequest {
        bytes32 schema;
        AttestationRequestData data;
    }
    function attest(AttestationRequest calldata request) external payable returns (bytes32);
}

contract HyblockIssuer {
    IEAS public eas;
    address public admin;
    bytes32 public schemaUID;

    constructor(address _eas) {
        eas = IEAS(_eas);
        admin = msg.sender;
    }

    function setSchemaUID(bytes32 _uid) external {
        require(msg.sender == admin, "Not admin");
        schemaUID = _uid;
    }

    // DB 명세에 맞춘 발행 함수
    function issue(
        address walletAddress,        // recipient
        bytes32 personalDataHash,     // 개인정보 해시
        string calldata attestationType, // 증명서 타입
        string calldata revealedData, // 선택적 공개 정보 (JSON 문자열)
        bool isGraduated              // 수료 여부
    ) external returns (bytes32) {
        require(msg.sender == admin, "Not admin");

        // 스키마 순서: address, bytes32, string, string, bool
        bytes memory data = abi.encode(
            walletAddress,
            personalDataHash,
            attestationType,
            revealedData,
            isGraduated
        );

        return eas.attest(IEAS.AttestationRequest({
            schema: schemaUID,
            data: IEAS.AttestationRequestData({
                recipient: walletAddress,
                expirationTime: 0,
                revocable: true,
                refUID: 0,
                data: data,
                value: 0
            })
        }));
    }
}
