// This script checks if the 

const fs = require('fs');
// const path = require('path');
// const execSync = require('child_process').execSync;
// const argv = require('yargs-parser')(process.argv.slice(2), {
//   alias: { folder: ['folders'], language: ['languages'] },
//   array: [ 'folders', 'languages' ],
//   default: { folders: ['standard'], languages: ['all'], filename: 'genshindb.js', outdir: 'dist', libraryname: 'GenshinDb' }
// });

const autoconfig = require('./config.json');
const importconfig = require('../import/config.json');

const serverEnum = {
    GL: 'GL',
    jp: 'jp'
};

checkMasterdata(serverEnum.GL);
// checkMasterdata(serverEnum.jp);

// checkFileassets(serverEnum.GL);
// checkFileassets(serverEnum.jp);

// masterdata_version
function checkMasterdata(server) {
    if (!Object.values(serverEnum).includes(server)) {
        console.log(`Invalid server ${server} provided to checkMasterdata(). Must be one of: ${Object.values(serverEnum).join(', ')}.`);
        return;
    }

    if (autoconfig.masterdata_version[server] === importconfig.masterdata_version[server]) {
        console.log(`No update needed for masterdata_version ${server}`);
    }

    try {


        autoconfig.masterdata_version[server] = importconfig.masterdata_version[server];
        autoconfig.masterdata_version[`${server}_update_time`] = new Date().toUTCString();
        fs.writeFileSync('./config.json', JSON.stringify(autoconfig, null, '  '));
    } catch (e) {
        console.log(e);
    }
}

function checkFileassets(server) {
    if (!Object.values(serverEnum).includes(server)) {
        console.log(`Invalid server ${server} provided to checkFileassets(). Must be one of: ${Object.values(serverEnum).join(', ')}.`);
        return;
    }

    if (autoconfig.fileassets_version[server] === importconfig.fileassets_version[server]) {
        console.log(`No update needed for checkFileassets ${server}`);
    }

    try {

        autoconfig.fileassets_version[server] = importconfig.fileassets_version[server];
        autoconfig.fileassets_version[`${server}_update_time`] = new Date().toUTCString();
        fs.writeFileSync('./config.json', JSON.stringify(autoconfig, null, '  '));
    } catch (e) {
        console.log(e);
    }
}