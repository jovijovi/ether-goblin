import fs from 'fs';
import path from 'path';
import writeFileAtomic from 'write-file-atomic';
import {Cache} from '../../common/cache';
import {DefaultDumpCacheDir, DefaultDumpCacheFile} from './params';

// LoadCacheFromFile load cache from file
export function LoadCacheFromFile(): number {
	const filePath = path.resolve(DefaultDumpCacheDir, DefaultDumpCacheFile);
	if (!fs.existsSync(filePath)) {
		return 0;
	}

	const data = fs.readFileSync(filePath, 'utf8');
	Cache.CacheContractOwner.load(JSON.parse(data));

	return Cache.CacheContractOwner.size;
}

// DumpCacheToFile dump cache to file
export async function DumpCacheToFile(): Promise<number> {
	const dirPath = path.resolve(DefaultDumpCacheDir);
	const filePath = path.resolve(dirPath, DefaultDumpCacheFile);

	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, {recursive: true});
	}

	const dmp = Cache.CacheContractOwner.dump();
	await writeFileAtomic(filePath, JSON.stringify(dmp));
	return dmp.length;
}
