// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// A simple NFT contract
contract GoblinToken is ERC20 {
    constructor() ERC20("GoblinToken", "GOB") {
        _mint(msg.sender, 100 * (10 ** 18));
    }

    function faucet(address recipient, uint amount) external {
        _mint(recipient, amount);
    }
}
