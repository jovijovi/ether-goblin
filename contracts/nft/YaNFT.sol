// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// A simple NFT contract
contract YaNFT is ERC721Enumerable, Ownable {
    constructor() ERC721("YaNFT", "YNFT") {
    }

    function mint(address to, uint256 tokenId) external onlyOwner {
        _safeMint(to, tokenId);
    }

    function mintWithURI(address to, uint256 tokenId, bytes memory uri) external onlyOwner {
        _safeMint(to, tokenId, uri);
    }
}
