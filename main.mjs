import uFuzzy from '@leeoniya/ufuzzy';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const files = require('./data/files.json');

/**
 * 
 * @param {string} dataset 
 * @returns boolean
 */
export function validateDataset(dataset) {
	return dataset === 'master' || dataset === 'parsed';
}

/**
 * 
 * @param {string} language 
 * @returns boolean
 */
export function validateLanguage(language) {
	return language === 'en' || language === 'jp' || language === 'zh_cn' || language === 'zh_tw';
}

/**
 * Checks if a file exists for the dataset/language. Assumes the dataset and language are already valid.
 * @param {string} dataset 
 * @param {string} language 
 * @param {string} file 
 * @returns boolean
 */
export function validateFile(dataset, language, file) {
	return files[dataset][language].includes(file);
}

function loadJSON(dataset, language, file) {
	try {
		return require(`./data/${dataset}/${language}/${file}.json`);
	} catch(e) {
		return undefined;
	}
}

/**
 * 
 * @param {string} dataset 
 * @param {string} language 
 * @param {string} file 
 * @returns 
 */
export function getFile(dataset, language, file) {
	if (!validateDataset(dataset) || !validateLanguage(language) || !validateFile(dataset, language, file)) return undefined;
	return loadJSON(dataset, language, file);
}

function safeToString(x) {
	if (typeof x === 'string') return x;
	else if (x instanceof String) return x.toString();
	else return JSON.stringify(x);
}

/**
 * 
 * @param {string} dataset 
 * @param {string} language 
 * @param {string} file 
 * @param {string} key
 * @param {string} value 
 * @returns 
 */
export function getDataByKey(dataset, language, file, key, value) {
	const dataFile = getFile(dataset, language, file);
	if (!dataFile) return undefined;
	const dataObj = dataFile.find(obj => safeToString(obj[key]).toLowerCase() === safeToString(value).toLowerCase());
	if (!dataObj) return undefined;
	return dataObj;
}

/**
 * Parses through a string for languages, files, and keys, all of which are validated and cleaned.
 * @param {string} keyString input string
 * @example Example inputs
 * "/character.traits.battle_item.category"
 * "@en/character.names"
 * "traits.battle_item.names"
 * @returns {{languages: string[], files: string[], keys: string[]}}
 */
function parseKeys(keyString) {
	const result = { languages: [], files: [], keys: [] };
	if (!keyString) return result;

	const keyArr = keyString.split(/([@\/\\.])/);
	let currentPropType = 2;

	for (let key of keyArr) {
		key = key.trim();
		switch (key) {
			case '@':
				currentPropType = 0;
				continue;
			case '\\':
			case '/':
				currentPropType = 1;
				continue;
			case '.':
				currentPropType = 2;
				continue;
			case '':
				continue;
		}
		
		switch (currentPropType) {
			case 0:
				if (validateLanguage(key)) result.languages.push(key);
				continue;
			case 1:
				if (validateFile(key)) result.files.push(key);
				continue;
			case 2:
				result.keys.push(key);
				continue;
		}
	}
	return result;
}

/**
 * Parse through search options and initializes defaults.
 * @param {*} options 
 */
function parseSearchOptions(options) {
	const searchOpts = {
		firstResultOnly: false,
		multiKeyLogic: 'AND',
		resultLanguage: undefined
	};

	if (typeof options.firstResultOnly === 'boolean')
		searchOpts.firstResultOnly = options.firstResultOnly;
	if (options.multiKeyLogic && options.multiKeyLogic.toLowerCase() === 'and')
		searchOpts.multiKeyLogic = 'AND';
	else if (options.multiKeyLogic && options.multiKeyLogic.toLowerCase() === 'or')
		searchOpts.multiKeyLogic = 'OR';
	if (validateLanguage(options.resultLanguage))
		searchOpts.resultLanguage = options.resultLanguage;

	return searchOpts;
}

/**
 * 
 * @param {string} dataset 
 * @param {string|string[]} languages 
 * @param {string|string[]} files 
 * @param {string|string[]} keys array of keys
 * @param {string|string[]} query
 * @param {*} options 
 */
export function searchData(dataset, languages, files, keys, query, options={}) {
	// input validation
	if (!validateDataset(dataset)) return undefined;
	if (!Array.isArray(languages)) languages = [languages];
	languages = languages.filter(l => validateLanguage(l));
	if (!Array.isArray(files)) files = [files];
	if (!Array.isArray(keys)) keys = [keys];
	if (!Array.isArray(query)) query = [query];
	query = query.filter(q => q && q !== '');
	if (query.length === 0) return undefined;
	options = parseSearchOptions(options);

	/**
	 * @type {{
	 *   keyString: string,
	 *   matchedFiles: {
	 *     [file: string]: {
	 *       language: string,
	 *       matchedData: {
	 *         [id: string]: {
	 *           key: string,
	 *           value: string
	 *         }[]
	 *       },
	 *     },
	 *   },
	 * }[]}
	 */
	const searchResults = [];
		
	for (const [keyIndex, keyString] of keys.entries()) {
		searchResults[keyIndex] = { keyString: keyString, matchedFiles: {} };
		const keyParse = parseKeys(keyString);

		for (const file of keyParse.files.length !== 0 ? keyParse.files : files) {
			for (const language of keyParse.languages.length !== 0 ? keyParse.languages : languages) {
				const dataFile = getFile(dataset, language, file);
				if (!dataFile) continue;

				const targets = dataFile.flatMap(dataObj => getNestedValues({ dataId: dataObj.id }, dataObj, keyParse.keys));
				if (targets.length === 0) continue;

				const needle = query[keyIndex] || query.at(-1);

				// do ufuzzy search
				const ufOpts = {};
				// const ufOpts = { intraIns: Infinity, intraChars: "[a-z\d' ]" };
				const uf = new uFuzzy(ufOpts);
				const fuzzyResult = uf.search(targets.map(t => t.value), needle);

				if (fuzzyResult[0].length === 0) continue; // no result

				// save the sorted list of matched targets
				const matchedTargets = fuzzyResult[2].map(ordered => targets[fuzzyResult[0][ordered]]);
				searchResults[keyIndex].matchedFiles[file] = { language: language, matchedData: {} };
				for (const matchedTarget of matchedTargets) {
					(searchResults[keyIndex].matchedFiles[file].matchedData[matchedTarget.dataId] ||= []).push({
						key: matchedTarget.key,
						value: matchedTarget.value
					});
				}

				break; // skip the rest of the languages of this file
			}
		}
	}

	// compile the search results and figure out what to send back
	const result = [];

	if (options.multiKeyLogic === 'AND') {
		if (searchResults[0].matchedFiles.length === 0) return undefined; // no result

		const doneFiles = {};
		for (const keyResult of searchResults) {
			for (const file of Object.keys(keyResult.matchedFiles)) {
				if (doneFiles[file]) continue;
				doneFiles[file] = true;
				if (!searchResults.every(r => r.matchedFiles[file])) continue; // AND

				for (const id of Object.keys(keyResult.matchedFiles[file].matchedData)) {
					if (!searchResults.every(r => r.matchedFiles[file].matchedData[id])) continue; // AND

					const language = options.resultLanguage || keyResult.matchedFiles[file].language;
					const dataObj = getDataByKey(dataset, language, file, 'id', id);

					result.push({
						dataset: dataset,
						language: language,
						file: file,
						id: id,
						properties: searchResults.flatMap(kr => kr.matchedFiles[file].matchedData[id]),
						data: dataObj
					});
				}
			}
		}

	} else if (options.multiKeyLogic === 'OR') {

	}

	if (result.length === 0) return undefined;
	if (options.firstResultOnly) return result[0];
	return result;
}

// const result = searchData('parsed', ['en'], ['character'], ['name', 'attribute'], ['Resna', 'fire'], { multiKeyLogic: 'AND' });
// const result = searchData('parsed', ['en'], ['character'], ['initial_rarity'], ['3'], { multiKeyLogic: 'AND' });
// const result = searchData('master', ['en'], ['character'], ['attack_attributes'], ['5'], { multiKeyLogic: 'AND' });
// const result = searchData('master', ['en'], ['character'], ['attack_attributes', 'name'], ['5', 'resna'], { multiKeyLogic: 'AND' });
// console.log(result);
// console.log(result.length);

// "/character.traits.battle_item.category", "ATTACK"
// Retrieve a list of characters that have attack category battle item traits,
//  ordered by who has the most number of attack category battle item traits.

// "/character.name, /character.attribute", "Resna, fire"
// Retrieve a list of characters that have name "resna" and have "fire" attribute
// ... backend it does two separate searches. then compiles an intersection of the two search results. and returns it

// "/character.name, /material.name", "Resna, stick"
// Retrieve a list of characters that have name "resna" and then a list of materials with the name "stick"
// ... backend it does two separate searches. the return result is a combined list sorted in order

// "/all.name", "Resna"
// Retrieve a list of all data that have the name "Resna"

/**
 * Extract all values from the given object that matches our desired key and return a specially-crafted object.
 * @param {object} init contains data we wish to add to the return object.
 * @param {object} dataObj top-level object to start exploring from. do not input an array.
 * @param {string[]} keys array of keys of which we'll iterate through the nested object dataObj.
 * @param {number?} level number to keep track of which depth of keys we are at.
 * @param {string?} currentKey string that is built to keep track of the current key. example: traits.battle_item[1].name
 * @typdef {{ dataId: number, key: string, value: string }} DataProperty
 * @returns {DataProperty|DataProperty[]} Object or array depending on if there are multiple results. If there are no results, then empty array.
 */
function getNestedValues(init, dataObj, keys, level=0, currentKey=undefined, arrayIndex=undefined) {
	const key = arrayIndex !== undefined ? arrayIndex : keys[level];
	if (key === undefined) return [];

	const subData = dataObj[key];

	// update currentKey
	if (arrayIndex !== undefined) {
		currentKey = currentKey+'['+key+']';
	} else {
		currentKey = (currentKey ? currentKey+'.' : '')+key;
	}

	if (Array.isArray(subData)) {
		return subData.flatMap((_d, i) => getNestedValues(init, subData, keys, level+1, currentKey, i));

	} else if (typeof subData === 'object' && subData !== null) {
		return getNestedValues(init, subData, keys, level+1, currentKey);

	} else {
		return {
			dataId: init.dataId,
			key: currentKey, 
			value: safeToString(subData) 
		};
	}
}