const fs = require('fs');
const masterdata = require('./masterdata.js');
const config = require('./config.json');

const helper = require('./helper.js');
helper.setVersion('1.0.0', '170', 'en');

extractReslerianaData();

async function extractReslerianaData() {
	// await masterdata.extractMasterData('en');
	// await masterdata.extractMasterDataGl();
	// await masterdata.extractMasterDataJp();

	// parseMasterData();

	// updateFileList();
}

function parseMasterData() {
	for (const lang of config.languages) {
		helper.setLang(lang);

		runExtractor('./extractcharacter.js', 'parsed', 'character');
	}
}

function runExtractor(extractor, dataset, file) {
	try {
		const extract = require(extractor);
		delete require.cache[require.resolve(extractor)];
		helper.writeData(extract(), dataset, file);
	} catch (e) {
		if (e instanceof helper.DataNotFoundError) {
			console.log(e.message);
		} else {
			console.log(e);
		}
	}
}

function updateFileList() {
	const files = {};
	for (const dataset of ['master', 'parsed']) {
		files[dataset] = {};
		for (const language of config.languages) {
			if (fs.existsSync(`../data/${dataset}/${language}`)) {
				files[dataset][language] = fs.readdirSync(`../data/${dataset}/${language}`, { withFileTypes: true })
					.filter(item => !item.isDirectory())
					.map(f => f.name.substring(0, f.name.lastIndexOf('.')));
			}
		}
	}
	fs.mkdirSync(`../data`, { recursive: true });
	fs.writeFileSync(`../data/files.json`, JSON.stringify(files, null, '\t'));
}