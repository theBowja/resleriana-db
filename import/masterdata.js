const fs = require('fs');
const https = require('https');
const msgpackr = require('msgpackr');
const lz4 = require('lz4');
const crypto = require('crypto');
const config = require('./config.json');
const stringify = require('@aitodotai/json-stringify-pretty-compact');
BigInt.prototype.toJSON = function() { return this.toString(); }

module.exports = { extractMasterDataGl, extractMasterDataJp, extractMasterData };

async function extractMasterDataGl() {
    await extractMasterData('en');
    await extractMasterData('zh_cn');
    await extractMasterData('zh_tw');
}

async function extractMasterDataJp() {
    await extractMasterData('jp');
}

async function extractMasterData(lang) {
	const masterdata = await downloadMasterData(lang);
    const decrypted = decryptMasterData(masterdata, await getMasterDataVersion(lang));

	unpackMasterData(decrypted, lang);
}


async function downloadMasterData(lang) {
    const url = await getMasterDataUrl(lang);
	return await sendHttpRequest(url);
}

async function getMasterDataVersion(lang) {
    if (lang === 'jp') {
        if (!config.version.jp) {
            const response = await sendHttpRequest('https://gacha.lukefz.xyz/atelier/version');
            if (response) return JSON.parse(response).masterDataVersion;
            throw new Error('no masterdata version provided for jp');
        }
        return config.version.jp;
    } else {
        return config.version.GL;
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
function unpackMasterData(md, lang) {
    fs.mkdirSync(`../data/master/${lang}`, { recursive: true });
	const msgpack = new msgpackr.Unpackr({sequential: true })
	msgpackr.addExtension({
		type: 99,
		unpack: lz4Unpack
	});

	const data = msgpack.unpackMultiple(md);

	// catalog is stored at data[0] and is an array with each element in the format: [filename, [offset, size]]
	const catalog = [...data[0]].sort((a, b) => a[1][0]-b[1][0]).map(e => e[0]); // sort catalog by offset location and map by filename
	if (catalog.length !== data.length-1) console.log('???????????????????');

	catalog.forEach((filename, i) => {
        fs.writeFileSync(`../data/master/${lang}/${filename}.json`, stringify(data[i+1], { margins: true }));
	});
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