import uFuzzy from '@leeoniya/ufuzzy';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/**
 * 
 * @param {string} dataset 
 * @returns 
 */
export function validateDataset(dataset) {
	return dataset === 'master' || dataset === 'parsed';
}

/**
 * 
 * @param {string} language 
 * @returns 
 */
export function validateLanguage(language) {
	return language === 'jp' || language === 'en' || language === 'zh_cn' || language === 'zh_tw';
}

/**
 * Checks if a file exists for the dataset/language. Assumes the dataset and language are already valid.
 * @param {string} dataset 
 * @param {string} language 
 * @param {string} file 
 * @returns 
 */
export function validateFile(dataset, language, file) {
	return true; // unimplemented
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
	if (!validateDataset(dataset) || !validateLanguage(language) || !validateFile(file)) return undefined;
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
	const searchOpts = {};
	searchOpts.multiKeyLogic = 'AND';

	return searchOpts;
}

/**
 * 
 * @param {string} dataset 
 * @param {string[]} languages 
 * @param {string[]} files 
 * @param {string[]} keys array of keys
 * @param {string[]} query
 * @param {*} options 
 */
export function searchData(dataset, languages, files, keys, query, options={}) {
	const funT0 = performance.now();

	if (!validateDataset(dataset)) return undefined;
	languages = languages.filter(l => validateLanguage(l));
	files = files.filter(f => validateFile(f));
	if (query.length === 0) return undefined;
	options = parseSearchOptions(options);

	/**
	 * [
	 *  {
	 *     keyString: string,
	 *     matchedFiles: {
	 *       [file]: {
	 *         language: string,
	 *         matchedData: {
	 *           [id]: [
	 *             {
	 *               key: string,
	 *               value: string
	 *             },
	 *             ...
	 *           ]
	 *         }
	 *       }
	 *     }
	 *   },
	 *   ...
	 * ]
	 */
	const resultMap = [];
	
	const searchT0 = performance.now();
	
	for (const [keyIndex, keyString] of keys.entries()) {
		resultMap[keyIndex] = { keyString: keyString, matchedFiles: {} };
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
				resultMap[keyIndex].matchedFiles[file] = { language: language, matchedData: {} };
				for (const matchedTarget of matchedTargets) {
					(resultMap[keyIndex].matchedFiles[file].matchedData[matchedTarget.dataId] ||= []).push({
						key: matchedTarget.key,
						value: matchedTarget.value
					});
				}

				break; // skip the rest of the languages of this file
			}
		}
	}

	const searchT1 = performance.now();
	console.log(`search ${searchT1-searchT0} milliseconds`);
	
				// return only the first result if asked for
				// if (option.firstResultOnly)


	// compile the search results and figure out what to send back
	const result = [];

	// const matchedFiles = Object.keys(resultMap);
	// if (matchedFiles.length === 0) return undefined;

	if (options.multiKeyLogic === 'AND') {
		if (resultMap[0].matchedFiles.length === 0) return undefined; // no result

		const doneFiles = {};
		for (const keyResult of resultMap) {
			for (const file of Object.keys(keyResult.matchedFiles)) {
				if (doneFiles[file]) continue;
				doneFiles[file] = true;
				if (!resultMap.every(r => r.matchedFiles[file])) continue; // AND

				for (const id of Object.keys(keyResult.matchedFiles[file].matchedData)) {
					if (!resultMap.every(r => r.matchedFiles[file].matchedData[id])) continue; // AND

					const language = options.resultLanguage || keyResult.matchedFiles[file].language;
					const dataObj = getDataByKey(dataset, language, file, 'id', id);

					result.push({
						dataset: dataset,
						language: language,
						file: file,
						id: id,
						keys: a,
						data: dataObj
					});
				}
			}
		}

	} else if (options.multiKeyLogic === 'OR') {

	}

	const funT1 = performance.now();
	console.log(`function ${funT1-funT0} milliseconds`);
	return result;
}

// const result = searchData('parsed', ['en'], ['character'], ['name', 'attribute'], ['Resna', 'fire'], { multiKeyLogic: 'AND' });
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
 * @returns {object|object[]} Object or array depending on if there are multiple results. If there are no results, then empty array.
 */
function getNestedValues(init, dataObj, keys, level=0, currentKey=undefined) {
	const key = keys[level];
	if (key === undefined) return [];

	const subData = dataObj[key];
	if (!subData) return [];

	if (Array.isArray(subData)) {
		return subData.flatMap((d, i) => getNestedValues(init, d, keys, level+1, currentKey+'.'+key+'['+i+']'));

	} else if (typeof subData === 'object') { // we already checked for null and array above
		return getNestedValues(init, subData, keys, level+1, (currentKey ? currentKey+'.' : '')+key);

	} else {
		return {
			dataId: init.dataId,
			key: (currentKey ? currentKey+'.' : '')+key, 
			value: safeToString(subData) 
		};
	}
}