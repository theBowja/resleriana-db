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
const unpackTextAssets = require('../import/unpackTextAssets.js');

const autoconfig = require('./config.json');
const importconfig = require('../import/config.json');

main();

async function main() {
    await checkMasterdata('Global');
    await checkMasterdata('Japan');
    
    await checkFileassets('Global');
    await checkFileassets('Japan');

    console.log('done');
}

// masterdata_version
async function checkMasterdata(server, skipCheck=false) {
    // Validate input
    if (!importconfig.servers.includes(server)) {
        console.log(`Invalid server ${server} provided to checkMasterdata(). Must be one of: ${importconfig.servers.join(', ')}.`);
        return;
    }

    // Check if update needed
    if (!skipCheck && autoconfig.masterdata_version[server] === importconfig.masterdata_version[server]) {
        console.log(`No update needed for masterdata_version ${server}`);
        return;
    }

    // Do update
    try {
        const version = importconfig.masterdata_version[server];

        console.log(`${server}: Importing masterdata...`);
        await importer.extractReslerianaData(server);

        // Update config
        autoconfig.masterdata_version[server] = version;
        autoconfig.masterdata_version[`${server}_update_time`] = new Date().toUTCString();
        fs.writeFileSync(path.resolve(__dirname, './config.json'), JSON.stringify(autoconfig, null, '  '));
        console.log(`${server}: Finished updating masterdata to the version ${autoconfig.masterdata_version[server]}`);

    } catch (e) {
        console.log(e);
    }
}

async function checkFileassets(server, skipCheck=false) {
    // Validate input
    if (!importconfig.servers.includes(server)) {
        console.log(`Invalid server ${server} provided to checkFileassets(). Must be one of: ${importconfig.servers.join(', ')}.`);
        return;
    }

    // Check if update needed
    if (!skipCheck && autoconfig.fileassets_version[server] === importconfig.fileassets_version[server]) {
        console.log(`No update needed for checkFileassets ${server}`);
        return;
    }

    // Do update
    try {
        const platform = 'Android';
        const version = importconfig.fileassets_version[server];

        // Update bundlenames list
        console.log(`${server}: Downloading catalog... `);
        const catalogJSON = await catalog.getCatalogFromDownload(server, version, platform);
        const filterLabels = catalog.getFilterLabels(path.resolve(__dirname, `../resources/${server}/still_path_hash.txt`));
        console.log(`${server}: Updating catalog resources...`);
        catalog.getCatalogResources(server, catalogJSON, platform, 'Texture2D', filterLabels);
        catalog.getCatalogResources(server, catalogJSON, platform, 'TextAsset');

        // Download bundles using AtelierToolBundleDownload
        console.log(`${server}: Downloading fileassets...`);
        console.log(`This may take a while.`);
        const bundleDir = path.resolve(__dirname, `../resources/${server}/${platform}/bundles`);
        const bundleNamesTexture2D = path.resolve(__dirname, `../resources/${server}/${platform}/bundlenames_filtered_texture2d.txt`);
        const bundleNamesTextAsset = path.resolve(__dirname, `../resources/${server}/${platform}/bundlenames_all_textasset.txt`);
        tools.executeAtelierToolBundleDownload(server, platform, version, bundleDir, bundleNamesTexture2D);
        tools.executeAtelierToolBundleDownload(server, platform, version, bundleDir, bundleNamesTextAsset);

        // Generate path_hash_to_name.txt for images using UnityPyScripts
        console.log(`${server}: Generating path_hash_to_name.txt...`);
        const container_to_path_hash = path.resolve(__dirname, `../resources/${server}/container_to_path_hash.json`);
        const path_hash_to_name = path.resolve(__dirname, `../resources/${server}/path_hash_to_name.json`);
        tools.generateContainerToPathHash(container_to_path_hash, bundleDir, path_hash_to_name);

        // Export TextAsset to data
        console.log(`${server}: Exporting TextAsset to data...`);
        const textAssetByteDir = path.resolve(__dirname, `../resources/${server}/${platform}/TextAssetBytes`);
        const textAssetDir = path.resolve(__dirname, `../data/TextAsset/${server}`);
        tools.exportAssets(bundleNamesTextAsset, bundleDir, 'TextAsset', textAssetByteDir);
        unpackTextAssets.unpackFolder(textAssetByteDir, textAssetDir);
        importer.updateFileList([server]);

        // console.log(`Deleting downloaded bundles ${server}`);
        // for (const filename of fs.readdirSync(bundleDir)) {
        //     fs.unlinkSync(path.join(bundleDir, filename));
        // }

        // Update config
        autoconfig.fileassets_version[server] = version;
        autoconfig.fileassets_version[`${server}_update_time`] = new Date().toUTCString();
        fs.writeFileSync(path.resolve(__dirname, './config.json'), JSON.stringify(autoconfig, null, '  '));
        console.log(`${server}: Finished updating fileassets to the version ${autoconfig.fileassets_version[server]}`);

    } catch (e) {
        console.log(e);
    }
}