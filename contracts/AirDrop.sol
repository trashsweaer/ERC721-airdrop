// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./IERC721.sol";

contract AirDrop {

    address public immutable tokenAddr;
    bytes32 public immutable root;

    mapping(address => bool) public claims;
    
    event Claim(address indexed claimerAddr);

    constructor(address _tokenAddr, bytes32 _root) {
        tokenAddr = _tokenAddr;
        root = _root;
    }
    
    function claim(bytes32[] calldata merkleProof) external {
        require(canClaim(msg.sender, merkleProof), "Address is out of Hash tree");

        claims[msg.sender] = true;

        IERC721(tokenAddr).safeMint(msg.sender);

        emit Claim(msg.sender);
    }

    function canClaim(address claimerAddr, bytes32[] calldata merkleProof) public view returns (bool) {
        return !claims[claimerAddr] && MerkleProof.verify(merkleProof, root, keccak256(abi.encodePacked(claimerAddr)));
    }
}