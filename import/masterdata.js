const fs = require('fs');
const https = require('https');
const msgpackr = require('msgpackr');
const lz4 = require('lz4');
const crypto = require('crypto');
const config = require('./config.json');
const perfectJson = require('./perfectJson');
BigInt.prototype.toJSON = function() { return this.toString(); }

module.exports = { extractMasterDataGl, extractMasterDataJp, extractMasterData };

/**
 * 
 * @param {boolean} writePathHashes 
 */
async function extractMasterDataGl(writePathHashes=false) {
    await extractMasterData('en', writePathHashes);
    await extractMasterData('zh_cn', false);
    await extractMasterData('zh_tw', false);
}

/**
 * 
 * @param {boolean} writePathHashes 
 */
async function extractMasterDataJp(writePathHashes=false) {
    await extractMasterData('jp', writePathHashes);
}

async function extractMasterData(lang, writePathHashes=false) {
	const masterdata = await downloadMasterData(lang);
    const decrypted = decryptMasterData(masterdata, await getMasterDataVersion(lang));

	unpackMasterData(decrypted, lang, writePathHashes);
}


async function downloadMasterData(lang) {
    const url = await getMasterDataUrl(lang);
	return await sendHttpRequest(url);
}

async function getMasterDataVersion(lang) {
    if (lang === 'jp') {
        if (!config.masterdata_version.jp) {
            const response = await sendHttpRequest('https://gacha.lukefz.xyz/atelier/version');
            if (response) return JSON.parse(response).masterDataVersion;
            throw new Error('no masterdata version provided for jp');
        }
        return config.masterdata_version.jp;
    } else {
        return config.masterdata_version.GL;
    }
}

async function getMasterDataUrl(lang) {
    if (lang === 'jp') {
        return `https://asset.resleriana.jp/master_data/${await getMasterDataVersion(lang)}`;
    } else {
        return `https://asset.resleriana.com/master_data/${lang}/${await getMasterDataVersion(lang)}`;
    }
}


function sendHttpRequest(url) {
	return new Promise((resolve, reject) => {
		https.get(url, (response) => {
			if (response.statusCode !== 200) {
				reject(new Error(`Error fetching data: ${url}`));
				return;
			}
	
			let data = [];
			response.on('data', (chunk) => {
				data.push(chunk);
			});
			response.on('end', () => {
				resolve(Buffer.concat(data));
			});
	  	}).on('error', reject);
	});
}

/**
 * 
 * @param {*} input 
 * @param {*} version 
 * @returns 
 */
function decryptMasterData(masterdata, version) {
	const hash = crypto.createHash('sha256').update(`wTmkW6hwnA6HXnItdXjZp/BSOdPuh2L9QzdM3bx1e54=${version}`).digest();
	const key = hash.subarray(0, 16);
	const iv = hash.subarray(16, 32);
	const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
	decipher.setAutoPadding(true);
	let dec = decipher.update(masterdata);
	dec = Buffer.concat([dec, decipher.final()]);
	return dec;
}

/**
 * 
 * @param {Buffer} md 
 */
function unpackMasterData(md, lang, writePathHashes=false) {
    fs.mkdirSync(`../data/master/${lang}`, { recursive: true });

	const msgpack = new msgpackr.Unpackr({ useRecords: false, mapsAsObjects: true })
	msgpackr.addExtension({
		type: 99,
		unpack: lz4Unpack
	});

	// let catalog; // catalog is stored as a map of filenames => [offset, size]
	// let catalogOffset;
	let filenames;
	let pathHashes = new Set();
	msgpack.unpackMultiple(md, (data, start, end) => {
		if (filenames === undefined) {
			// catalog = data;
			// catalogOffset = end;
			filenames = Object.entries(data).sort((a, b) => b[1][0]-a[1][0]).map(e => e[0]); // sort catalog by offset location in reverse and map by filename
		} else {
			const filename = filenames.pop();
			const output = perfectJson(data, { singleLine: ({ value }) => Array.isArray(value) && typeof value[0] === 'number', compact: false })

			// sanity check. disable later for (minor) performance
			// if (JSON.stringify(data) !== JSON.stringify(JSON.parse(output))) {
			// 	console.log(`perfectJson is not perfectly converting data`);
			// }

			fs.writeFileSync(`../data/master/${lang}/${filename}.json`, output);

			if (writePathHashes) {
				for (const obj of data) {
					for (const [key, value] of Object.entries(obj)) {
						if (key.endsWith('still_path_hash') && value !== 0) {
							pathHashes.add(value);
						}
					}
				}
			}
		}
	});

	if (writePathHashes) {
		fs.mkdirSync(`./images`, { recursive: true });
		fs.writeFileSync(`./images/still_path_hash_${lang}.txt`, Array.from(pathHashes).sort().join('\n'));
	}
}

/**
 * Deserialize LZ4-block compressed data to JSON object.
 * @param {Buffer} buffer 
 * @returns {object} JSON data file
 */
function lz4Unpack(buffer) {
	let size;
	let sizeOffset;
	if (buffer[0] === 0xd2) { // 210
		if (!(buffer instanceof Buffer)) buffer = Buffer.from(buffer);
		size = buffer.readInt32BE(1);
		sizeOffset = 4;
	} else {
		return console.error(`unknown MessagePackCode for lz4 block header: [MessagePackCode][Size][Encoded Bytes]`);
		// https://github.com/MessagePack-CSharp/MessagePack-CSharp/blob/09dd95489d7dd73c3aa8c56b71c406ce4d0c92a3/src/MessagePack.UnityClient/Assets/Scripts/MessagePack/MessagePackCode.cs#L44
	}

	const input = buffer.subarray(1+sizeOffset, buffer.length);
	const decompressed = Buffer.alloc(size);
	lz4.decodeBlock(input, decompressed)

	return msgpackr.decode(decompressed);
}