const fs = require('fs');
const path = require('path');
const perfectJson = require('../import/perfectJson.js');
const importconfig = require('../import/config.json');

updateChangelog('Global', importconfig.masterdata_version.Global);

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
    for (const filename of importconfig.masterdata_track_changes) {
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
    const changelog = require(`../resources/${server}/masterdata_change_log.json`);
    if (changelog.some(e => e.masterdata_version === version)) return; // already done

    const previousDataIds = require(`../resources/${server}/masterdata_active_ids.json`);
    const activeDataIds = getActiveDataIds(importconfig.serverToLanguage[server][0]);

    // calculate changes
    const changeObj = {
        id: changelog.length,
        masterdata_version: version,
        log_update_time: new Date().toUTCString(),
        changes: {},
    };
    for (const filename of importconfig.masterdata_track_changes) {
        changeObj.changes[filename] = activeDataIds[filename].filter(id => !previousDataIds[filename].includes(id));
    }
    changelog.push(changeObj);

    // save masterdata_change_log.json
    fs.writeFileSync(path.resolve(__dirname, `../resources/${server}/masterdata_change_log.json`), toStringFlatArray(changelog));

    // save masterdata_active_ids.json
    fs.writeFileSync(path.resolve(__dirname, `../resources/${server}/masterdata_active_ids.json`), toStringFlatArray(activeDataIds));
}

function initialize(version) {
    for (const server of importconfig.servers) {
        const activeDataIds = getActiveDataIds(importconfig.serverToLanguage[server][0]);
        fs.writeFileSync(path.resolve(__dirname, `../resources/${server}/masterdata_active_ids.json`), toStringFlatArray(activeDataIds));
    }
}