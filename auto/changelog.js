const fs = require('fs');
const path = require('path');
const perfectJson = require('../import/perfectJson.js');
const importconfig = require('../import/config.json');

initialize();

function getData(dataset, locale, filename) {
    return require(`../data/${dataset}/${locale}/${filename}.json`);
}

/**
 * Checks start_at and end_at to see if the current time is within the time range
 * @param {object} data 
 * @returns {boolean}
 */
function isActiveData(data) {
	if (data.start_at && new Date() < new Date(data.start_at) ||
		data.end_at && new Date(data.end_at) < new Date())
		return false;
	return true;
}

function getActiveDataIds(lang) {
    const activeDataIds = {};
    for (const filename of ['character', 'memoria', 'item']) {
        const listdata = getData('master', lang, filename);
        const ids = listdata.filter(isActiveData).map(data => data.id);
        activeDataIds[filename] = ids;
    }

    return activeDataIds;
}

function toStringFlatArray(obj) {
    return perfectJson(obj, { singleLine: ({ value }) => Array.isArray(value) && typeof value[0] === 'number', compact: false });
}

function updateChangelog(server, version) {
    const previousDataIds = require(`../resources/${server}/masterdata_active_ids.json`);
    const activeDataIds = getActiveDataIds(importconfig.serverToLanguage[server][0]);

    fs.writeFileSync(path.resolve(__dirname, `../resources/${server}/masterdata_active_ids.json`), toStringFlatArray(activeDataIds));
}

function initialize(version) {
    for (const server of importconfig.servers) {
        const activeDataIds = getActiveDataIds(importconfig.serverToLanguage[server][0]);
        fs.writeFileSync(path.resolve(__dirname, `../resources/${server}/masterdata_active_ids.json`), toStringFlatArray(activeDataIds));
    }
}