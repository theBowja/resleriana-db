// Helper script to map "npm run [script]" calls to various functions of interest.

const fs = require('fs');
const path = require('path');

// const upload = require('./upload.js');
const importer = require('../import/import.js');
const catalog = require('../import/catalog.js');
const tools = require('../tools/tools.js');
const unpackTextAssets = require('../import/unpackTextAssets.js');

const importconfig = require('../import/config.json');

const argv = require('yargs-parser')(process.argv.slice(2), {
    string: [ 'server', 'platform', 'version', 'script', 'outputFolder',
        'imageFormat', 'imagesOutputFolder', 'imageNamesOutputPath', 'regexFilter' ],
    boolean: [ 'skipDownloads', 'redoCache', 'doNotWrite' ],
    number: ['processes'],

    coerce: { server: coerceServer, platform: coercePlatform, outputFolder: coerceOutputFolder, imageFormat: coerceImageFormat,
        imagesOutputFolder: coerceImagesOutputFolder, imageNamesOutputPath: coerceImageNamesOutputPath },

    default: { server: 'Global', platform: 'StandaloneWindows64', imageFormat: 'webp' },

    alias: { skipDownloads: ['skipDownload'], regexFilter: ['regex'] }
});

function coerceServer(server) {
    return importconfig.servers.includes(server) ? server : 'Global';
}

function coercePlatform(platform) {
    return importconfig.platforms.includes(platform) ? platform : 'StandaloneWindows64';
}

function coerceOutputFolder(outputFolder) {
    return outputFolder ? path.resolve(process.cwd(), outputFolder) : undefined;
}

function coerceImageFormat(imageFormat) {
    return imageFormat.toLowerCase() === 'png' ? imageFormat.toLowerCase() : 'webp';
}

function coerceImagesOutputFolder(imagesOutputFolder) {
    return imagesOutputFolder ? path.resolve(process.cwd(), imagesOutputFolder) : undefined;
}

function coerceImageNamesOutputPath(imageNamesOutputPath) {
    return imageNamesOutputPath ? path.resolve(process.cwd(), imageNamesOutputPath) : undefined;
}

main();
async function main() {
    switch (argv.script.toLowerCase()) {
        case 'updatecatalogresources':
            break;

        case 'downloadbundles':
            break;

        case 'extractimages':
            await extractImages(argv.server, argv.platform, argv.version, argv.imageFormat, argv.imagesOutputFolder, argv.imageNamesOutputPath, argv.skipDownloads, argv.regexFilter);
            break;

        case 'textasset':
            await textAsset(argv.server, argv.platform, argv.version);
            break;

        case 'extractbgm':
            await extractAudioClip(argv.server, argv.platform, argv.version, 'SoundSetting', argv);
            break;
        case 'extractvoice':
            await extractAudioClip(argv.server, argv.platform, argv.version, 'VoiceSetScriptableObject', argv);
            break;

        default:
            // console.log('what did you mean by that?');
    }
    console.log('done');
}

async function extractImages(server="Global", platform="StandaloneWindows64", version=importconfig.fileassets_version[server],
        imageFormat="webp", imagesOutputFolder, imageNamesOutputPath=undefined,
        skipDownloads=false, regexFilter=undefined) {
    
    console.log(`Extracting ${imageFormat} images for ${server} ${platform} ${version}`)

    const bundleDir = path.resolve(__dirname, `../resources/${server}/${platform}/bundles`);
    const bundleNamesTexture2D = path.resolve(__dirname, `../resources/${server}/${platform}/bundlenames_all_texture2d.txt`);
    if (!imagesOutputFolder)
        imagesOutputFolder = path.resolve(__dirname, `../resources/${server}/${platform}/Texture2D`);
    if (!imageNamesOutputPath)
        imageNamesOutputPath = path.resolve(__dirname, `../resources/${server}/${platform}/filenames_${regexFilter ? 'regex' : 'all'}_texture2d.txt`);

    if (!skipDownloads) {
        console.log(`Downloading catalog... `);
        const catalogJSON = await catalog.getCatalogFromDownload(server, version, platform);
        catalog.getCatalogResources(server, catalogJSON, platform, 'Texture2D');
        console.log(`Downloading bundles...`);
        tools.executeAtelierToolBundleDownload(server, platform, version, bundleDir, bundleNamesTexture2D);
    }

    console.log(`Exporting images...`);
    tools.exportAssets(bundleNamesTexture2D, bundleDir, 'Texture2D', imagesOutputFolder, imageNamesOutputPath, imageFormat, regexFilter);
}

// Export TextAsset to resources folder
async function textAsset(server="Global", platform="StandaloneWindows64", version=importconfig.fileassets_version[server]) {
    console.log(`${server}: Exporting TextAsset to data...`);
    const catalogJSON = await catalog.getCatalogFromDownload(server, version, platform);
    catalog.getCatalogResources(server, catalogJSON, platform, 'TextAsset');

    const bundleDir = path.resolve(__dirname, `../resources/${server}/${platform}/bundles`);
    const bundleNamesTextAsset = path.resolve(__dirname, `../resources/${server}/${platform}/bundlenames_all_textasset.txt`);
    tools.executeAtelierToolBundleDownload(server, platform, version, bundleDir, bundleNamesTextAsset);

    const textAssetByteDir = path.resolve(__dirname, `../resources/${server}/${platform}/TextAssetBytes`);
    const textAssetDir = path.resolve(__dirname, `../resources/${server}/TextAsset`);
    tools.exportAssets(bundleNamesTextAsset, bundleDir, 'TextAsset', textAssetByteDir);
    unpackTextAssets.unpackFolder(textAssetByteDir, textAssetDir, true);
}

// Export AudioClip to resources folder
async function extractAudioClip(server="Global", platform="StandaloneWindows64", version=importconfig.fileassets_version[server], type='SoundSetting',
    { redoCache=false, skipDownloads=false, processes=undefined, outputFolder=undefined, doNotWrite=false } = {}) {
    console.log(`${server} | ${platform} | ${version} | ${type}`);
    console.log(`Script started: extractAudioClip`);
    const t0 = performance.now();

    // Download catalog
    const catalogJSON = await catalog.getCatalogFromDownload(server, version, platform);
    catalog.getCatalogResources(server, catalogJSON, platform, type);

    // Variables
    const bundleNamesAllPath = path.resolve(__dirname, `../resources/${server}/${platform}/bundlenames_all_${type.toLowerCase()}.txt`);
    const bundleNamesAllSet = new Set(readBundleNames(bundleNamesAllPath));
    const catalogBundlesAll = catalogJSON._fileCatalog._bundles.filter(b => bundleNamesAllSet.has(b._relativePath));
    const bundleNamesCachePath = path.resolve(__dirname, `../resources/${server}/${platform}/bundlenames_cache_${type.toLowerCase()}.txt`);
    const bundleDir = path.resolve(__dirname, `../resources/${server}/${platform}/bundles`);
    if (doNotWrite) outputFolder = undefined;
    else if (outputFolder === undefined) outputFolder = path.resolve(__dirname, `../resources/${server}/${platform}/${type}`);
    const filenamesPath = path.resolve(__dirname, `../resources/${server}/${platform}/filenames_all_${type.toLowerCase()}`);
    const cachedPath = path.resolve(__dirname, `../resources/${server}/${platform}/cache_${type.toLowerCase()}.json`);

    if (redoCache) {
        // Download the bundles
        tools.executeAtelierToolBundleDownload(server, platform, version, bundleDir, bundleNamesAllPath);
        // Extract resources from the bundles
        tools.exportAssets(bundleNamesAllPath, bundleDir, 'AudioClip', outputFolder, filenamesPath, undefined, undefined, bundleNamesCachePath, processes);
    
    } else {
        // Make a new bundle list out of the cached previous result and the typed bundle names list
        const cached = fs.existsSync(cachedPath) ? require(cachedPath) : { hasResource: {}, noResource: {} };
        const catalogBundlesCache = catalogBundlesAll.filter(b => {
            return cached.hasResource[b._relativePath] || cached.noResource[b._relativePath] !== b._hash;
        });

        // Write the list of bundles we want to download
        const bundleNamesCacheSet = new Set(catalogBundlesCache.map(b => b._relativePath));
        fs.writeFileSync(bundleNamesCachePath, Array.from(bundleNamesCacheSet).sort().join('\n'));
        
        // Download the bundles
        tools.executeAtelierToolBundleDownload(server, platform, version, bundleDir, bundleNamesCachePath);
        // Extract resources from the bundles
        tools.exportAssets(bundleNamesCachePath, bundleDir, 'AudioClip', outputFolder, filenamesPath, undefined, undefined, bundleNamesCachePath, processes);
    } 

    // Update the cache with the result of the extraction
    const bundleNamesCacheNew = new Set(readBundleNames(bundleNamesCachePath));
    const cached = { hasResource: {}, noResource: {} };
    for (const name of bundleNamesCacheNew) {
        cached.hasResource[name] = true;
    }
    for (const name of bundleNamesAllSet) {
        if (bundleNamesCacheNew.has(name)) continue;
        try {
            cached.noResource[name] = catalogBundlesAll.find(b => b._relativePath === name)._hash;
        } catch(e) {
            console.log(`Failed to find catalog bundle for ${name}`);
        }
    }
    fs.writeFileSync(cachedPath, JSON.stringify(cached, null, '\t'));

    const t1 = performance.now();
    console.log(`Completed script extractAudioClip in ${(t1-t0)/1000} seconds`)
}

function readBundleNames(file) {
    return fs.readFileSync(file).toString().split(/\r\n|\n|\r/);
}