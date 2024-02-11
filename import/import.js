const fs = require('fs');
const helper = require('./helper.js');
helper.setVersion('1.0.0', '170', 'en');

extractReslerianaData();

function extractReslerianaData() {

	helper.writeData(require('./extractcharacter.js')(), 'parsed', 'character');

	// // // helper.writeData(helper.extractAndReplace('character'), 'parsed', 'character');
	updateFileList();
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