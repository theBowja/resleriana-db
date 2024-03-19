// This script checks if the 

const fs = require('fs');
const path = require('path');
// const execSync = require('child_process').execSync;
// const argv = require('yargs-parser')(process.argv.slice(2), {
//   alias: { folder: ['folders'], language: ['languages'] },
//   array: [ 'folders', 'languages' ],
//   default: { folders: ['standard'], languages: ['all'], filename: 'genshindb.js', outdir: 'dist', libraryname: 'GenshinDb' }
// });
const upload = require('./upload.js');
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
    
    await checkFileassets('Global', false, true);
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

async function checkFileassets(server, skipCheck=false, uploadImages=false) {
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
        const platform = 'Android'; // smaller bundles
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

        // Update images for Cloudinary
        if (uploadImages) {
            await updateImages(server, version, catalogJSON);
        }

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

/**
 * Update images and automatically upload them to Cloudinary.
 * @param {string} server 
 * @param {object} catalogJSON 
 */
async function updateImages(server, version, catalogJSON) {
    const platform = 'StandaloneWindows64'; // has better quality images
    fs.mkdirSync(path.resolve(__dirname, `../resources/${server}/${platform}`), { recursive: true });

    // Initialize all paths
    const bundleDir = path.resolve(__dirname, `../resources/${server}/${platform}/bundles`);
    const bundleNamesTexture2D = path.resolve(__dirname, `../resources/${server}/${platform}/bundlenames_all_texture2d.txt`);
    const output_resources = path.resolve(__dirname, `../resources/${server}/${platform}/Texture2D`);
    const image_names_path = path.resolve(__dirname, `../resources/${server}/${platform}/filenames_all_texture2d.txt`);

    // Get list of all bundle names with Texture2D
    catalog.getCatalogResources(server, catalogJSON, platform, 'Texture2D');

    // Download all Texture2D bundles
    tools.executeAtelierToolBundleDownload(server, platform, version, bundleDir, bundleNamesTexture2D);

    // Unpack images and lossy compress to webp. Write image names
    tools.exportAssets(bundleNamesTexture2D, bundleDir, 'Texture2D', output_resources, image_names_path);

    const imageNames = getListFromFile(image_names_path);
    const name_to_path_hash = objectSwap(require(`../resources/${server}/path_hash_to_name.json`));
    const uploadFolder = `${server}/${platform}`;

    console.log('Uploading images to Cloudinary...');
    console.log('This may take a very long time if there are a lot of new images...');
    let count = 0;
    for (const imageName of imageNames) {
        const imagePath = path.join(output_resources, imageName+'.webp');

        count += await upload.uploadImageFromPath(imagePath, uploadFolder);
        if (name_to_path_hash[imageName]) {
            count+= await upload.uploadImageFromPath(imagePath, uploadFolder, name_to_path_hash[imageName]);
        }

        if (count % 100 === 0) {
            process.stdout.write(`Progress: ${count} images\r`);
            upload.saveSizeCache();
        }
    }

    // Sort size cache so that it is alphabetical and that path_hashes come last.
    upload.sortSizeCache(uploadFolder, (a, b) => {
        const aIsPathHash = /^\d/.test(a[0]) && !a[0].includes('_');
        const bIsPathHash = /^\d/.test(b[0]) && !b[0].includes('_');

        if (aIsPathHash && !bIsPathHash) return 1;
        else if (!aIsPathHash && bIsPathHash) return -1;
        else if (a[0] < b[0]) return -1;
        else if (a[0] > b[0]) return 1;
        else return 0;
    });
    upload.saveSizeCache();

    console.log(`Finished uploading ${count} images to Cloudinary`);
}

/**
 * Helper function to retrieve a list of strings from a newline-delimited txt file.
 * @param {string} filePath if relative path, then it is relative to current working directory.
 * @returns {string[]}
 */
function getListFromFile(filePath) {
    filePath = path.resolve(process.cwd(), filePath);
    return fs.readFileSync(filePath).toString().split(/\r\n|\n|\r/);
}

/**
 * Swaps an object's keys and values.
 * @param {object} obj 
 * @returns {object}
 */
function objectSwap(obj) {
    const ret = {};
    Object.keys(obj).forEach(key => {
      ret[obj[key]] = key;
    });
    return ret;
}