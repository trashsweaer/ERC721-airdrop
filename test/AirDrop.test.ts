import {expect} from "chai";
import { randomBytes } from "crypto";
import {MerkleTree} from "merkletreejs";
import { Wallet } from "ethers";
import keccak256 from "keccak256";
import { ethers } from "hardhat";
import { AirDrop__factory, MyToken__factory } from "../typechain-types";

describe("Airdrop", () => {
    it("Works well", async() => {
        const [signer, candidate] = await ethers.getSigners();

        const nft = await new MyToken__factory(signer).deploy();
        const addrArray = new Array(10).fill(0).map(() => new Wallet(randomBytes(32).toString('hex')).address);
        const merkleTree = new MerkleTree(
            addrArray.concat(signer.address),
            keccak256,
            {hashLeaves: true, sortPairs: true}
        );
        
        const root = merkleTree.getHexRoot();

        const airDrop = await new AirDrop__factory(signer).deploy(nft.address, root);

        await nft.grantRole(await nft.MINTER_ROLE(), airDrop.address);

        const proof = merkleTree.getHexProof(keccak256(signer.address));
        
        expect(await airDrop.claims(signer.address)).to.eq(false);
        expect(await airDrop.canClaim(signer.address, proof)).to.eq(true);
        await airDrop.claim(proof);

        expect(await airDrop.claims(signer.address)).to.eq(true);
        expect(await airDrop.canClaim(signer.address, proof)).to.eq(false);

        expect(await nft.ownerOf(0)).to.eq(signer.address);

        await expect(airDrop.claim(proof)).to.be.revertedWith("Address is out of Hash tree");

        expect(await airDrop.claims(candidate.address)).to.eq(false);
        expect(await airDrop.canClaim(candidate.address, proof)).to.eq(false);
        
        await expect(airDrop.connect(candidate).claim(proof)).to.be.revertedWith("Address is out of Hash tree");

        const maliciousProof = merkleTree.getHexProof(keccak256(candidate.address));

        expect(maliciousProof).to.eql([]);

        expect(await airDrop.canClaim(candidate.address, maliciousProof)).to.eq(false);

        await expect(airDrop.connect(candidate).claim(maliciousProof)).to.be.revertedWith("Address is out of Hash tree");

    });
});