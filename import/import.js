const fs = require('fs');
const path = require('path');
const masterdata = require('./masterdata.js');
const config = require('./config.json');

const helper = require('./helper.js');
helper.setVersion('1.0.0', '170', 'en');

// extractReslerianaData();

module.exports = {
	extractReslerianaData,
	extractReslerianaDataAll,
	parseMasterData
}

/**
 * 
 * @param {string} server 
 */
async function extractReslerianaData(server) {
	const languages = config.serverToLanguage[server];
    if (!languages) {
        console.log(`Invalid server ${server} provided to extractReslerianaData(). Must be one of: ${Object.keys(config.serverToLanguage).join(', ')}.`);
        return;
    }

	let first = true;
	for (const language of languages) {
		await masterdata.extractMasterData(server, language, first);
		first = false;
	}

	parseMasterData(languages);

	updateFileList(languages);
}

async function extractReslerianaDataAll() {
	for (const server of Object.keys(config.serverToLanguage)) {
		await extractReslerianaData(server);
	}
}

/**
 * 
 * @param {string|string[]} languages 
 */
function parseMasterData(languages=config.languages) {
	if (!Array.isArray(languages)) languages = [languages];
	for (const lang of languages) {
		helper.setLang(lang);

		runExtractor('./parse/extractcharacter.js', lang, 'parsed', 'character');
		runExtractor('./parse/extractmemoria.js', lang, 'parsed', 'memoria');
		// runExtractor('./parse/extractquest.js', 'parsed', 'quest');
		runExtractor('./parse/extractmaterial.js', lang, 'parsed', 'material');
	}
}

function runExtractor(extractor, language, dataset, file) {
	try {
		const extract = require(extractor);
		helper.writeData(extract(language), dataset, file);
	} catch (e) {
		if (e instanceof helper.DataNotFoundError) {
			console.log(e.message);
		} else {
			console.log(e);
		}
	}
}

/**
 * 
 * @param {string[]} languages 
 */
function updateFileList(languages=config.languages) {
	const files = require('../data/files.json');
	for (const dataset of ['master', 'parsed']) {
		if (!files[dataset]) files[dataset] = {};
		for (const language of languages) {
			if (fs.existsSync(path.resolve(__dirname, `../data/${dataset}/${language}`))) {
				files[dataset][language] = fs.readdirSync(path.resolve(__dirname, `../data/${dataset}/${language}`), { withFileTypes: true })
					.filter(item => !item.isDirectory())
					.map(f => f.name.substring(0, f.name.lastIndexOf('.')));
			}
		}
	}

	fs.writeFileSync(path.resolve(__dirname, `../data/files.json`), JSON.stringify(files, null, '\t'));
}