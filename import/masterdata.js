const fs = require('fs');
const path = require('path');
const https = require('https');
const msgpackr = require('msgpackr');
const lz4 = require('lz4');
const crypto = require('crypto');
const config = require('./config.json');
const perfectJson = require('./perfectJson');
BigInt.prototype.toJSON = function() { return this.toString(); }

module.exports = { extractMasterData };

/**
 * 
 * @param {string} server 
 * @param {string} lang 
 * @param {boolean} writePathHashes 
 * @returns 
 */
async function extractMasterData(server, language, writePathHashes=false) {
    if (!config.servers.includes(server) || !config.languages.includes(language)) {
        console.log(`Invalid server ${server} or language ${language} provided to extractMasterData().`);
        return;
    }

	const masterdata = await downloadMasterData(language);
    const decrypted = decryptMasterData(masterdata, getMasterDataVersion(language));

	unpackMasterData(decrypted, server, language, writePathHashes);
}

/**
 * 
 * @param {string} lang 
 * @returns {Buffer}
 */
async function downloadMasterData(lang) {
    const url = getMasterDataUrl(lang);
	return await sendHttpRequest(url);
}

/**
 * 
 * @param {string} lang 
 * @returns {string}
 */
function getMasterDataVersion(lang) {
    if (lang === 'jp') {
        return config.masterdata_version.Japan;
    } else {
        return config.masterdata_version.Global;
    }
}

function getMasterDataUrl(lang) {
    if (lang === 'jp') {
        return `https://asset.resleriana.jp/master_data/${getMasterDataVersion(lang)}`;
    } else {
        return `https://asset.resleriana.com/master_data/${lang}/${getMasterDataVersion(lang)}`;
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
 * Decrypts the masterdata file.
 * @param {Buffer} masterdata 
 * @param {string} version 
 * @returns {Buffer}
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
 * Deserializes the decrypted masterdata into a JSON object and writes it to file.
 * @param {Buffer} md 
 * @param {string} server
 * @param {string} lang
 * @param {boolean} writePathHashes
 */
function unpackMasterData(md, server, lang, writePathHashes=false) {
    fs.mkdirSync(path.resolve(__dirname, `../data/master/${lang}`), { recursive: true });

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

			fs.writeFileSync(path.resolve(__dirname, `../data/master/${lang}/${filename}.json`), output);

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
		fs.mkdirSync(path.resolve(__dirname, `./images`), { recursive: true });
		fs.writeFileSync(path.resolve(__dirname, `./images/still_path_hash_${server.toLowerCase()}.txt`), Array.from(pathHashes).sort().join('\n'));
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