const fs = require('fs');
const stringify = require('json-stringify-pretty-compact');

let version = '1.0.0';
let patch = '170';
let lang = 'en';

/**
 * @param v {string} version
 * @param p {string} patch
 * @param l {string} lang - one of 'en', 'zh-cn', 'zh-tw', 'jp'
 */
function setVersion(v, p, l) {
	version = v;
	patch = p;
	lang = l;
}

const attributeTypeMap = {
	null: 'NONE',
	1: 'PHYSICAL',
	2: 'MAGIC'
};

const attributeMap = {
	1: 'SLASH',
	2: 'STRIKE',
	3: 'STAB',

	5: 'FIRE',
	6: 'ICE',
	7: 'BOLT',
	8: 'AIR',
};

const targetMap = {
	2: 'ALLY', // one
	3: 'ENEMY', // one
	4: 'ALLY', // all
	5: 'ENEMY', // all
};

const rangeMap = {
	2: 'ONE', // ally
	3: 'ONE', // enemy
	4: 'ALL', // ally
	5: 'ALL', // enemy
};


function loadJSON(file) {
	// try {
		return require(`../masterdata_output/${lang}/${file}.json`);
	// } catch (e) { console.log(`failed to loadJSON for ${file}`) }
}

/**
 * @param data {object} json object
 * @param folder {string} name of file to write
 */
function writeData(data, folder) {
	fs.mkdirSync(`../data/${lang}`, { recursive: true });
	fs.writeFileSync(`../data/${lang}/${folder}.json`, stringify(data));
}

module.exports = {
	setVersion: setVersion,
	attributeTypeMap: attributeTypeMap,
	attributeMap: attributeMap,
	targetMap: targetMap,
	rangeMap: rangeMap,
	loadJSON: loadJSON,
	writeData: writeData
}