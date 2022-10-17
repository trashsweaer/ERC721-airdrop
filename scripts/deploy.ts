import { randomBytes } from "crypto";
import { Wallet } from "ethers";
import { ethers } from "hardhat";
import keccak256 from "keccak256";
import MerkleTree from "merkletreejs";
import { MyToken__factory, AirDrop__factory } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();

  const nft = await new MyToken__factory(signer).deploy();

  await nft.deployed();

  console.log("Successfully deployed to address: ", nft.address);

  const addrArray = new Array(10).fill(0).map(() => new Wallet(randomBytes(32).toString('hex')).address);

  const merkleTree = new MerkleTree(
    addrArray.concat(signer.address),
    keccak256,
    {hashLeaves: true, sortPairs: true}
  );

  const root = merkleTree.getHexRoot();

  const airDrop = await new AirDrop__factory(signer).deploy(nft.address, root);

  await airDrop.deployed();

  console.log("Airdrop deployed to address: ", airDrop.address);

  await (await nft.grantRole(await nft.MINTER_ROLE(), airDrop.address)).wait();

  const proof = merkleTree.getHexProof(keccak256(signer.address));

  console.log("Proof for Сlaim:'", proof);

  run("verify:verify", {
    address: nft.address,
    contract: "contracts/MyToken.sol:MyToken"
  });

  run("verify:verify", {
    address: nft.address,
    contract: "contracts/AirDrop.sol:AirDrop",
    constructorArguments: [nft.address, root]
  });

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
