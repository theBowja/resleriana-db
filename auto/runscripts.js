// This script is the entry point for all npm run-scripts

const path = require('path');
const fs = require('fs');

const extract = require('./extract.js');
const importconfig = require('../import/config.json');
const tools = require('../tools/tools.js');

const argv = require('yargs-parser')(process.argv.slice(2), {
    string: [ 'server', 'platform', 'version', 'script', 'bundlesFolder', 'outputFolder',
              'imageFormat', 'imageNamesOutputPath', 'regexFilter' ],
    boolean: [ 'skipDownloads', 'redoCache', 'skipOutputFolder' ],
    number: ['processes'],

    coerce: { server: coerceServer, platform: coercePlatform, imageFormat: coerceImageFormat,
        bundlesFolder: coercePath, outputFolder: coercePath, imageNamesOutputPath: coercePath },

    default: { server: 'Global', platform: 'StandaloneWindows64', imageFormat: 'webp' },

    alias: { skipDownloads: ['skipDownload'], regexFilter: ['regex'] }
});

function coerceServer(server) {
    return importconfig.servers.includes(server) ? server : 'Global';
}

function coercePlatform(platform) {
    return importconfig.platforms.includes(platform) ? platform : 'StandaloneWindows64';
}

function coercePath(filepath) {
    return filepath ? path.resolve(process.cwd(), filepath) : undefined;
}

function coerceImageFormat(imageFormat) {
    return imageFormat.toLowerCase() === 'png' ? imageFormat.toLowerCase() : 'webp';
}

function setArgvDefaults() {
    if (argv.bundlesFolder === undefined)
        argv.bundlesFolder = path.resolve(__dirname, `../resources/${argv.server}/${argv.platform}/bundles`);
}

main();
async function main() {
    setArgvDefaults();

    switch (argv.script.toLowerCase()) {
        case 'updatecatalogresources':
            break;

        case 'downloadbundles':
            if (argv.outputFolder === undefined) {
                argv.outputFolder = path.resolve(__dirname, `../resources/${argv.server}/${argv.platform}/bundles`);
                fs.mkdirSync(path.resolve(argv.outputFolder, 'Embed'), { recursive: true });
            }
            if (argv.version === undefined) {
                argv.version = importconfig.fileassets_version[argv.server];
            }
            tools.executeAtelierToolBundleDownload(argv.server, argv.platform, argv.version, argv.outputFolder);
            break;
        
        case 'dumpbundlenames':
            tools.dumpBundlenames(argv.bundlesFolder, argv);
            break;

        case 'dumpfilenames':
            // tools.dumpFilenames(argv.bundl)
            break;

        case 'updatepathhashmap':
            await extract.updatePathHashMap(argv.server, argv.platform, argv.version, argv);
            break;

        case 'extractimages':
            await extract.extractImages(argv.server, argv.platform, argv.version, argv);
            break;

        case 'extracttext':
            await extract.extractTextAsset(argv.server, argv.platform, argv.version, argv);
            break;

        case 'extractbgm':
            await extract.extractAudioClip(argv.server, argv.platform, argv.version, 'SoundSetting', argv);
            break;
        case 'extractvoice':
            await extract.extractAudioClip(argv.server, argv.platform, argv.version, 'VoiceSetScriptableObject', argv);
            break;

        default:
            // console.log('what did you mean by that?');
    }
    console.log('done');
}
