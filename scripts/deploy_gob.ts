import {ethers} from 'hardhat';
import {GoblinToken, GoblinToken__factory} from '../typechain-types';

async function main(): Promise<void> {
	const goblinTokenFactory: GoblinToken__factory = await ethers.getContractFactory("GoblinToken") as GoblinToken__factory;
	const goblinToken: GoblinToken = await goblinTokenFactory.deploy();
	await goblinToken.deployed();
	console.log("Contract deployed to: ", goblinToken.address);
}

main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});
