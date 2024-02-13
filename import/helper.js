const fs = require('fs');
const stringify = require('@aitodotai/json-stringify-pretty-compact');
const manualmap = require('./manualmap.js');

const meta = {
	version: '1.0.2',
	patch: '999',
	lang: 'en'
}

/**
 * @param v {string} version
 * @param p {string} patch
 * @param l {string} lang - one of 'en', 'zh-cn', 'zh-tw', 'jp'
 */
function setVersion(v, p, l) {
	meta.version = v;
	meta.patch = p;
	meta.lang = l;
}

function setLang(l) {
	meta.lang = l;
}

class DataNotFoundError extends Error {
	constructor(message) {
		super(message);
		this.name = 'DataNotFoundError';
	}
}

function loadJSON(file) {
	try {
		return require(`../data/master/${meta.lang}/${file}.json`);
	} catch (e) {
		throw new DataNotFoundError(`failed to loadJSON for /data/master/${meta.lang}/${file}.json`)
	}
}

function loadJSONMap(file, id='id') {
	if (manualmap[file]) return manualmap[file]
	const xjson = loadJSON(file);
	const xmap = {}
	xjson.forEach(obj => xmap[obj[id]] = obj);
	return xmap;
}

/**
 * @param data {object} json object
 * @param folder {string} name of file to write
 */
function writeData(data, dataset, folder) {
	fs.mkdirSync(`../data/${dataset}/${meta.lang}`, { recursive: true });
	fs.writeFileSync(`../data/${dataset}/${meta.lang}/${folder}.json`, stringify(data, { margins: true }));
}

/**
 * 
 * @param {string} file 
 */
function extractAndReplace(file, replaceIds=true, removeHash=true) {
	if (!file) return;

	const temp = replaceIdsRecurs(loadJSON(file), removeHash);

	return temp;
}

function replaceIdsRecurs(obj, removeHash) {
	if (Array.isArray(obj)) {
		return obj.map(o => replaceIdsRecurs(o, removeHash));

	} else if (isObject(obj)) {
		return Object.entries(obj).reduce((accum, [key, val]) => {
			
			if (key.endsWith('_id') || key.endsWith('_ids')) {
				const newkey = key.substring(0, key.lastIndexOf('_'));
				if (['filter'].includes(newkey)) accum[key] = val;
				else {
					let file = getFilename(newkey);

					if (key.endsWith('_id'))
						accum[newkey] = replaceIdsRecurs(loadJSONMap(file)[val], removeHash);
					else
						accum[newkey] = val.map(id => replaceIdsRecurs(loadJSONMap(file)[id], removeHash));
				}

			} else if (key.endsWith('_hash')) {

			} else {
				accum[key] = val;
			}

			return accum;
		}, {});
	}
	
	return obj;
}

function getFilename(property) {
	switch (property) {
	case 'burst_skill':
	case 'normal1_skill':
	case 'normal2_skill':
		return 'skill';
	case 'ex_growboard':
		return 'growboard';
	case 'page':
		return 'growboard_page';
	case 'panel':
		return 'growboard_panel';
	case 'support_color':
		return 'trait_color';
	default:
		return property;
	}
}

function isObject(obj) {
	return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
}

module.exports = {
	DataNotFoundError: DataNotFoundError,
	setVersion: setVersion,
	setLang: setLang,
	loadJSON: loadJSON,
	loadJSONMap: loadJSONMap,
	writeData: writeData,
	extractAndReplace: extractAndReplace,
}