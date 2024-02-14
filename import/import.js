const fs = require('fs');
const masterdata = require('./masterdata.js');

const helper = require('./helper.js');
helper.setVersion('1.0.0', '170', 'en');

extractReslerianaData();

async function extractReslerianaData() {
	await masterdata.extractMasterData('en');
	await masterdata.extractMasterData('jp');
	await masterdata.extractMasterData('zh_cn');
	await masterdata.extractMasterData('zh_tw');

	// parseMaster();

	// updateFileList();
}

function parseMaster() {
	for (const lang of ['en', 'jp', 'zh_cn', 'zh_tw']) {
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
		for (const language of ['en', 'jp', 'zh-cn', 'zh-tw']) {
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