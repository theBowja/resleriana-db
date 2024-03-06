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
const catalog = require('../import/catalog.js');
const tools = require('../tools/tools.js');

const autoconfig = require('./config.json');
const importconfig = require('../import/config.json');

main();

async function main() {
    // await checkMasterdata('Global');
    // await checkMasterdata('Japan');
    
    await checkFileassets('Global');
    // await checkFileassets('Japan');
}

// masterdata_version
async function checkMasterdata(server) {
    // Validate input
    if (!importconfig.servers.includes(server)) {
        console.log(`Invalid server ${server} provided to checkMasterdata(). Must be one of: ${importconfig.servers.join(', ')}.`);
        return;
    }

    // Check if update needed
    if (autoconfig.masterdata_version[server] === importconfig.masterdata_version[server]) {
        console.log(`No update needed for masterdata_version ${server}`);
        return;
    }

    // Do update
    try {
        console.log(`Importing masterdata ${server}...`);
        await importer.extractReslerianaData(server);

        // Update config
        autoconfig.masterdata_version[server] = importconfig.masterdata_version[server];
        autoconfig.masterdata_version[`${server}_update_time`] = new Date().toUTCString();
        fs.writeFileSync(path.resolve(__dirname, './config.json'), JSON.stringify(autoconfig, null, '  '));
        console.log(`Updated masterdata ${server} to the version ${autoconfig.masterdata_version[server]}`);
    } catch (e) {
        console.log(e);
    }
}

async function checkFileassets(server) {
    // Validate input
    if (!importconfig.servers.includes(server)) {
        console.log(`Invalid server ${server} provided to checkFileassets(). Must be one of: ${importconfig.servers.join(', ')}.`);
        return;
    }

    // Check if update needed
    if (autoconfig.fileassets_version[server] === importconfig.fileassets_version[server]) {
        console.log(`No update needed for checkFileassets ${server}`);
        return;
    }

    // Do update
    try {
        const platform = 'Android';

        console.log(`Updating catalog resources ${server}...`);
        await catalog.getCatalogResourcesDownload(server, importconfig.fileassets_version[server], platform, 'Texture2D', path.resolve(__dirname, `../images/${server}/still_path_hash.txt`));
        
        // Download bundles using AtelierToolBundleDownload
        console.log(`Downloading fileassets ${server}...`);
        console.log(`This may take a while.`);
        const outputDir = path.resolve(__dirname, `../images/${server}/${platform}/bundles`);
        const bundleNames = path.resolve(__dirname, `../images/${server}/${platform}/bundlenames_filtered_texture2d.txt`);
        tools.executeAtelierToolBundleDownload(server, platform, importconfig.fileassets_version[server], outputDir, bundleNames);

        // Generate path_hash_to_name.txt using UnityPyScripts
        console.log(`Generating path_hash_to_name.txt ${server}`);


        // console.log(`Deleting downloaded bundles ${server}`);
        // for (const filename of fs.readdirSync(outputDir)) {
        //     fs.unlinkSync(path.join(outputDir, filename));
        // }

        // Update config
        autoconfig.fileassets_version[server] = importconfig.fileassets_version[server];
        autoconfig.fileassets_version[`${server}_update_time`] = new Date().toUTCString();
        fs.writeFileSync(path.resolve(__dirname, './config.json'), JSON.stringify(autoconfig, null, '  '));
        console.log(`Updated fileassets ${server} to the version ${autoconfig.fileassets_version[server]}`);
    } catch (e) {
        console.log(e);
    }
}