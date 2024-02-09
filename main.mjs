import uFuzzy from '@leeoniya/ufuzzy';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/**
 * 
 * @param {*} dataset 
 * @returns 
 */
export function validateDataset(dataset) {
	return dataset === 'master' || dataset === 'parsed';
}

/**
 * 
 * @param {*} language 
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
 * 
 * @param {string} dataset 
 * @param {string[]} languages 
 * @param {string[]} files 
 * @param {*} options 
 */
export function searchData(dataset, languages, files, keys, query, options={}) {
	if (!validateDataset(dataset)) return undefined;
	// todo validate input

	const targets = [];

	// build the list of targets for fuzzy search
	for (const language of languages) {
		for (const file of files) {
			const dataFile = getFile(dataset, language, file);
			if (!dataFile) continue;

			for (const key of keys) {
				targets.push({
					dataset: dataset,
					language: language,
					file: file,
					key: key,
					value: 'tmp'
				});
			}
		}
	}

}

