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
 * 
 * @param {string} dataset 
 * @param {string[]} languages 
 * @param {string[]} files 
 * @param {string[]} keys array of keys
 * @param {*} options 
 */
export function searchData(dataset, languages, files, keys, query, options={}) {
	if (!validateDataset(dataset)) return undefined;
	languages = languages.filter(l => validateLanguage(l));
	files = files.filter(f => validateFile(f));

	/**
	 * {
	 *   {dataset}/{file}: {
	 * 	   {keyString}: {
	 *       targets: list of targets
	 *       matches:
	 *     }
	 *   },
	 * //  OR (results are combined)
	 *   {dataset}/{file}: {
	 * 
	 *   }
	 * }
	 */
	const resultMap = {};

	
	let t0 = performance.now();
	
	for (const [keyIndex, keyString] of keys.entries()) {
		const keyParse = parseKeys(keyString);

		for (const file of keyParse.files.length !== 0 ? keyParse.files : files) {
			for (const language of keyParse.languages.length !== 0 ? keyParse.languages : languages) {
				const dataFile = getFile(dataset, language, file);
				if (!dataFile) continue;

				const targets = dataFile.flatMap(dataObj => getNestedValues({
					dataset: dataset,
					language: language,
					file: file,
					data: dataObj,
				}, dataObj, keyParse.keys));

				// do ufuzzy search

				// let opts = { intraIns: Infinity, intraChars: "[a-z\d' ]" };

				// if there is a result. save the list of ids and break the language loop
			}
		}
	}

	let t1 = performance.now();
	console.log(`${t1-t0} milliseconds`);

	// compile the search results and figure out what to send back

}

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
			dataset: init.dataset,
			language: init.language,
			file: init.file,
			dataId: init.dataId,
			key: (currentKey ? currentKey+'.' : '')+key, 
			value: safeToString(subData) 
		};
	}
}