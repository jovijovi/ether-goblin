const {ethers} = require('hardhat');
import {expect} from 'chai';
import {BigNumber, Signer, utils, Wallet} from 'ethers';
import {YaNFT, YaNFT__factory} from '../../typechain-types';
// import * as mockTom from '../mock/tom.json';
// import * as mockJerry from '../mock/jerry.json';

describe("NFT contract", function () {
	const mockTokenId1 = "1";
	const mockTokenId2 = "2";

	const contractName = "YaNFT";
	const contractSymbol = "YNFT";

	let contractAddress: string;
	let owner: Signer, signer1: Signer, signer2: Signer;
	let ownerAddress: string, signer1Address: string, signer2Address: string;

	async function getAccounts() {
		[owner, signer1, signer2] = await ethers.getSigners();

		ownerAddress = await owner.getAddress();
		console.debug("Owner=", ownerAddress);

		signer1Address = await signer1.getAddress();
		console.debug("Addr1=", signer1Address);

		signer2Address = await signer2.getAddress();
		console.debug("Addr2=", signer2Address);
	}

	async function attachContract(name: string, address: string): Promise<YaNFT> {
		const contractFactory = await ethers.getContractFactory(name);
		return contractFactory.attach(address);
	}

	function getWallet(pk: string): Wallet {
		return new Wallet(pk, ethers.provider);
	}

	async function connectContract(address: string): Promise<YaNFT> {
		return YaNFT__factory.connect(contractAddress, await ethers.getSigner(address));
	}

	before("tear up", async function () {
		await getAccounts();
	})

	it("deploy", async function () {
		const contractFactory = await ethers.getContractFactory(contractName);
		const contract = await contractFactory.deploy();
		contractAddress = contract.address;
		console.debug("Contract address=", contractAddress);
		console.debug("Contract signer=", await contract.signer.getAddress());
		console.debug("Contract owner=", await contract.owner());
	})

	it("name", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const name = await contract.name();
		console.debug("Name=", name);
		expect(name).to.equal(contractName);
	})

	it("symbol", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const symbol = await contract.symbol();
		console.debug("Symbol=", symbol);
		expect(symbol).to.equal(contractSymbol);
	})

	it("mint", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const tx = await contract.mint(signer1Address, mockTokenId1);
		console.debug("Tx=", tx.hash);
		const receipt = await tx.wait(1);
		console.debug("Receipt=", receipt);
		expect(receipt.status).to.equal(1);
	});

	it("mintWithURI", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const uri = utils.toUtf8Bytes('http://localhost/token/2');
		const tx = await contract.mintWithURI(signer2Address, mockTokenId2, uri);
		console.debug("Tx=", tx.hash);
		const receipt = await tx.wait(1);
		console.debug("Receipt=", receipt);
		expect(receipt.status).to.equal(1);
	});

	it("totalSupply", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const rspTotalSupply = await contract.totalSupply();
		console.debug("TotalSupply=", rspTotalSupply.toString());
		expect(rspTotalSupply.toString()).to.equal(BigNumber.from(2).toString());
	});

	it("balanceOf", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const balance = await contract.balanceOf(await signer1.getAddress());
		console.debug("Balance(%s)=%s", signer1Address, balance.toString());
		expect(balance.toString()).to.equal(BigNumber.from(1).toString());
	})

	it("transfer", async function () {
		const contract = await connectContract(await signer1.getAddress());
		const tx = await contract.transferFrom(signer1Address, signer2Address, mockTokenId1);
		console.debug("Tx=", tx.hash);
		const receipt = await tx.wait(1);
		console.debug("Receipt=%o", receipt);
		expect(receipt.status).to.equal(1);
		console.debug("Transfer from %s to %s finished.", signer1Address, signer2Address);
	})

	it("ownerOf", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const owner = await contract.ownerOf(mockTokenId1);
		console.debug("Token(%s) owner=%s", mockTokenId1, owner);
		expect(owner).to.equal(signer2Address);
	})

	it("tokenURI", async function () {
		const contract = await attachContract(contractName, contractAddress);
		const tokenURI = await contract.tokenURI(mockTokenId1);
		console.debug("Token(%s) tokenURI=%s", mockTokenId1, tokenURI);
	})
});
