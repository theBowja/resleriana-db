// This script checks if the 

const fs = require('fs');
const path = require('path');
// const execSync = require('child_process').execSync;
// const argv = require('yargs-parser')(process.argv.slice(2), {
//   alias: { folder: ['folders'], language: ['languages'] },
//   array: [ 'folders', 'languages' ],
//   default: { folders: ['standard'], languages: ['all'], filename: 'genshindb.js', outdir: 'dist', libraryname: 'GenshinDb' }
// });
// const upload = require('./upload.js');
const importer = require('../import/import.js');
const catalog = require('../import/catalog.js');
const tools = require('../tools/tools.js');
const unpackTextAssets = require('../import/unpackTextAssets.js');
const changelog = require('./changelog.js');
const extract = require('./extract.js');

const autoconfig = require('./config.json');
const importconfig = require('../import/config.json');

main();

async function main() {
    await checkMasterdata('Global');
    await checkMasterdata('Japan');
    
    await checkFileassets('Global', false, false);
    await checkFileassets('Japan', false, false);

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

        // Update changelog
        console.log(`${server}: Updating change log...`);
        changelog.updateChangelog(server, version);

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
        const platform = 'StandaloneWindows64'; // bigger bundles
        const version = importconfig.fileassets_version[server];

        // Paths
        const checkedBundlesPath = path.resolve(__dirname, `../resources/${server}/${platform}/checked_bundles.json`);
        const bundleDir = path.resolve(__dirname, `../resources/${server}/${platform}/bundles`);
        const bundleNamesDir = path.resolve(__dirname, `../resources/${server}/${platform}/bundlenames`);
        const fileNamesDir = path.resolve(__dirname, `../resources/${server}/${platform}/filenames`);
        const bundlesnamesToProcessPath = path.resolve(__dirname, `../resources/${server}/${platform}/bundlenames_to_process.txt`);

        // Figure out which bundles we haven't checked yet
        const checkedBundles = fs.existsSync(checkedBundlesPath) ? require(checkedBundlesPath) : {};
        const catalogJSON = await catalog.getCatalogFromDownload(server, version, platform);
        const bundlesToProcess = catalogJSON._fileCatalog._bundles.filter(bundle => {
            return (checkedBundles[bundle._relativePath] === undefined || checkedBundles[bundle._relativePath] !== bundle._hash);
        });
        const bundlenamesToProcess = bundlesToProcess.map(b => b._relativePath);
        fs.writeFileSync(bundlesnamesToProcessPath, bundlenamesToProcess.sort().join('\n'));

        // Download new bundles we haven't checked yet
        tools.executeAtelierToolBundleDownload(server, platform, version, bundleDir, bundlesnamesToProcessPath);

        // Dump list of bundlenames for each asset type
        tools.dumpBundlenames(bundleDir, { output_folder: bundleNamesDir });

        // Dump list of filenames for certain asset types
        tools.dumpFilenames(path.join(bundleNamesDir, 'TextAsset.txt'), bundleDir, 'TextAsset', { filename_list: path.join(fileNamesDir, 'TextAsset.txt') })
        tools.dumpFilenames(path.join(bundleNamesDir, 'AudioClip.txt'), bundleDir, 'AudioClip', { filename_list: path.join(fileNamesDir, 'AudioClip.txt') })
        tools.dumpFilenames(path.join(bundleNamesDir, 'Texture2D.txt'), bundleDir, 'Texture2D', { filename_list: path.join(fileNamesDir, 'Texture2D.txt') })

        // Generate mapping between still path hash and image name
        await extract.updatePathHashMap(server, platform, version);

        // Export TextAsset to resources
        await extract.extractTextAsset(server, platform, version);

        // Update audio file names
        await extract.extractAudioClip(server, platform, version, 'SoundSetting', { skipOutputFolder: true });
        await extract.extractAudioClip(server, platform, version, 'VoiceSetScriptableObject', { skipOutputFolder: true });

        // // Update image file names from 
        const imagesBundlenames = path.resolve(__dirname, `../resources/${server}/${platform}/bundlenames/Texture2D_catalog.txt`);
        const imageNamesOutputPath = path.resolve(__dirname, `../resources/${server}/${platform}/filenames/Texture2D_catalog.txt`);
        await extract.extractImages(server, platform, version, { skipOutputFolder: true, imageNamesOutputPath: imageNamesOutputPath, bundleNamesInputPath: imagesBundlenames });

        // Update images and upload them to Cloudinary
        // if (uploadImages) {
        //     await updateImages(server, version);
        // }

        // console.log(`Deleting downloaded bundles ${server}`);
        // const bundleDir = path.resolve(__dirname, `../resources/${server}/${platform}/bundles`);
        // for (const filename of fs.readdirSync(bundleDir)) {
        //     fs.unlinkSync(path.join(bundleDir, filename));
        // }
        
        // Update checked bundles
        for (const bundle of bundlesToProcess) {
            checkedBundles[bundle._relativePath] = bundle._hash;
        }
        fs.writeFileSync(checkedBundlesPath, JSON.stringify(checkedBundles, null, '\t'))

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
// async function updateImages(server, version) {
//     const platform = 'StandaloneWindows64'; // has better quality images
//     fs.mkdirSync(path.resolve(__dirname, `../resources/${server}/${platform}`), { recursive: true });

//     // Variables
//     const output_resources = path.resolve(__dirname, `../resources/${server}/${platform}/Texture2D`);
//     const image_names_path = path.resolve(__dirname, `../resources/${server}/${platform}/filenames_all_texture2d.txt`);

//     // Extract images
//     await extract.extractImages(server, platform, version,
//         { imageFormat: 'webp', output_folder: output_resources, filename_list: image_names_path });

//     // Variables
//     const imageNames = getListFromFile(image_names_path);
//     const name_to_path_hash = objectSwap(require(`../resources/${server}/path_hash_to_name.json`));
//     const uploadFolder = `${server}/${platform}`;

//     // Upload to Cloudinary
//     console.log('Uploading images to Cloudinary...');
//     console.log('This may take a very long time if there are a lot of new images...');
//     let count = 0;
//     for (const imageName of imageNames) {
//         const imagePath = path.join(output_resources, imageName+'.webp');

//         count += await upload.uploadImageFromPath(imagePath, uploadFolder);
//         if (name_to_path_hash[imageName]) {
//             count+= await upload.uploadImageFromPath(imagePath, uploadFolder, name_to_path_hash[imageName]);
//         }

//         if (count % 100 === 0) {
//             process.stdout.write(`Progress: ${count} images\r`);
//             upload.saveSizeCache();
//         }
//     }

//     // Sort size cache so that it is alphabetical and that path_hashes come last.
//     upload.sortSizeCache(uploadFolder, (a, b) => {
//         const aIsPathHash = /^\d/.test(a[0]) && !a[0].includes('_');
//         const bIsPathHash = /^\d/.test(b[0]) && !b[0].includes('_');

//         if (aIsPathHash && !bIsPathHash) return 1;
//         else if (!aIsPathHash && bIsPathHash) return -1;
//         else if (a[0] < b[0]) return -1;
//         else if (a[0] > b[0]) return 1;
//         else return 0;
//     });
//     upload.saveSizeCache();

//     console.log(`Finished uploading ${count} images to Cloudinary`);
// }

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