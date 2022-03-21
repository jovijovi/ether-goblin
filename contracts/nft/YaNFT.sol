// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

// A simple NFT contract
contract YaNFT is ERC721Enumerable {
    constructor() ERC721("YaNFT", "YNFT") {
    }
}
