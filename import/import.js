const helper = require('./helper.js');
helper.setVersion('1.0.0', '170', 'en');

extractReslerianaData();

function extractReslerianaData() {

	helper.writeData(require('./extractcharacter.js')(), 'parsed', 'character');

	// // // helper.writeData(helper.extractAndReplace('character'), 'parsed', 'character');
}