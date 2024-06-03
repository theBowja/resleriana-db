// Helper script to map "npm run [script]" calls to various functions of interest.

// const fs = require('fs');
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
    boolean: [ 'skipDownloads' ],

    coerce: { server: coerceServer, platform: coercePlatform, imageFormat: coerceImageFormat,
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