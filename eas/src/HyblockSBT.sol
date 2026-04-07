// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC5192 {
    function locked(uint256 tokenId) external view returns (bool);
}

/**
 * @title HyblockSBT
 * @dev ERC-5192 (Soulbound Token) standard compliant certificate.
 * Tokens are non-transferable (locked) once minted.
 */
contract HyblockSBT is ERC721URIStorage, Ownable {
    event Locked(uint256 tokenId);

    uint256 private _nextTokenId;

    // OZ v5: Ownable requires an initialOwner address
    constructor() ERC721("Hyblock Certificate", "HBC") Ownable(msg.sender) {}

    /**
     * @dev ERC-5192 compliant locked status.
     * Always returns true as these certificates are non-transferable.
     */
    function locked(uint256 /*tokenId*/) external pure returns (bool) {
        return true;
    }

    /**
     * @dev Mint a new Soulbound Token to a recipient.
     * @param recipient The address that will receive the certificate.
     * @param uri The IPFS URI for metadata.
     */
    function safeMint(address recipient, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);
        emit Locked(tokenId);
    }

    /**
     * @dev OZ v5: Internal function to handle minting, burning, and transfers.
     * Replaces _beforeTokenTransfer and _afterTokenTransfer.
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        virtual
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        // Block transfers (from != 0 && to != 0)
        if (from != address(0) && to != address(0)) {
            revert("HyblockSBT: Soulbound tokens cannot be transferred");
        }
        return super._update(to, tokenId, auth);
    }

    // --- Overrides required by Solidity for multiple inheritance ---

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721URIStorage)
        returns (bool)
    {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }
}
