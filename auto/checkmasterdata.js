// This script checks if the 

const fs = require('fs');
const path = require('path');
// const execSync = require('child_process').execSync;
// const argv = require('yargs-parser')(process.argv.slice(2), {
//   alias: { folder: ['folders'], language: ['languages'] },
//   array: [ 'folders', 'languages' ],
//   default: { folders: ['standard'], languages: ['all'], filename: 'genshindb.js', outdir: 'dist', libraryname: 'GenshinDb' }
// });
const importer = require('../import/import.js');

const autoconfig = require('./config.json');
const importconfig = require('../import/config.json');

main();

async function main() {
    await checkMasterdata('GL');
    await checkMasterdata('jp');
    
    await checkFileassets('GL');
    await checkFileassets('jp');
}

// masterdata_version
async function checkMasterdata(server) {
    if (!importconfig.servers.includes(server)) {
        console.log(`Invalid server ${server} provided to checkMasterdata(). Must be one of: ${importconfig.servers.join(', ')}.`);
        return;
    }

    if (autoconfig.masterdata_version[server] === importconfig.masterdata_version[server]) {
        console.log(`No update needed for masterdata_version ${server}`);
    }

    try {
        console.log(`Importing masterdata ${server}...`);
        await importer.extractReslerianaData(server);

        autoconfig.masterdata_version[server] = importconfig.masterdata_version[server];
        autoconfig.masterdata_version[`${server}_update_time`] = new Date().toUTCString();
        fs.writeFileSync(path.resolve(__dirname, './config.json'), JSON.stringify(autoconfig, null, '  '));
        console.log(`Updated masterdata ${server} to the version ${autoconfig.masterdata_version[server]}`);
    } catch (e) {
        console.log(e);
    }
}

async function checkFileassets(server) {
    if (!importconfig.servers.includes(server)) {
        console.log(`Invalid server ${server} provided to checkFileassets(). Must be one of: ${importconfig.servers.join(', ')}.`);
        return;
    }

    if (autoconfig.fileassets_version[server] === importconfig.fileassets_version[server]) {
        console.log(`No update needed for checkFileassets ${server}`);
    }

    try {
        console.log(`Download fileassets ${server}...`);
        console.log(`This may take a while.`);

        autoconfig.fileassets_version[server] = importconfig.fileassets_version[server];
        autoconfig.fileassets_version[`${server}_update_time`] = new Date().toUTCString();
        fs.writeFileSync(path.resolve(__dirname, './config.json'), JSON.stringify(autoconfig, null, '  '));
        console.log(`Updated fileassets ${server} to the version ${autoconfig.fileassets_version[server]}`);
    } catch (e) {
        console.log(e);
    }
}