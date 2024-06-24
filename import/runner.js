// Manually run import functions
const fs = require('fs');
const path = require('path');
const msgpackr = require('msgpackr');

const config = require('./config.json');
const importer = require('./import.js');
const catalog = require('./catalog.js');
const tools = require('../tools/tools.js');
const unpackTextAssets = require('./unpackTextAssets.js');

const server = 'Global';
// const platform = 'Android';
const platform = 'StandaloneWindows64';
const fileassets_version = config.fileassets_version[server];

console.log('running');

// importer.parseMasterData('en');
// importer.runExtractor('./parse/parserecipe.js', 'en', 'parsed', 'recipe');

updateCatalogResources();
async function updateCatalogResources() {
    const catalogJSON = await catalog.getCatalogFromDownload(server, fileassets_version, platform);
    catalog.getCatalogResources(server, catalogJSON, platform, 'TextAsset');
}

// let asdf = require('../resources/Global/StandaloneWindows64/catalog/buckets.json');
// console.log(asdf[29631]);
// let tmp = require('../resources/Global/StandaloneWindows64/catalog/entries.json');
// console.log(tmp[582]);

// console.log(tmp.length);
// for (let i = 0; i < tmp.length; i++) {

//     if (tmp[i].primary === "402b44a5d2c04ddae13799552e2a8c7e.bundle") {
//         console.log(i);
//     }
// }


// const bundles_dir = path.resolve(__dirname, `../resources/${server}/${platform}/bundles`)
// const bundle_names_path = path.resolve(__dirname, `../resources/${server}/${platform}/bundlenames_all_texture2d.txt`);
// // const output_resources = path.resolve(__dirname, `../resources/${server}/${platform}/Texture2D`);
// const output_resources = path.resolve(__dirname, `../resources/${server}/${platform}/Texture2D`);
// const image_names_path = path.resolve(__dirname, `../resources/${server}/${platform}/filenames_all_texture2d.txt`);

// // tools.executeAtelierToolBundleDownload(server, platform, fileassets_version, bundles_dir, bundle_names_path);
// // tools.exportAssets(bundle_names_path, bundles_dir, 'Texture2D', { output_folder: output_resources, filename_list: image_names_path });

// const textAssetByteDir = "D:\\Workspace\\Resleriana\\tmp\\TextAsset";
// const textAssetDir = "D:\\Workspace\\Resleriana\\tmp\\TextAssetDe";
// unpackTextAssets.unpackFolder(textAssetByteDir, textAssetDir);

// // const tmp = `D:\\Workspace\\Resleriana\\resleriana-db\\resources\\Global\\Android\\TextAsset\\TalkEvent_05_036ID_en`;
// // const tmp = `D:\\Workspace\\Resleriana\\resleriana-db\\resources\\Global\\Android\\TextAsset\\GLSystemText_en`;
// // const tmp = `D:\\Workspace\\Resleriana\\resleriana-db\\resources\\Global\\Android\\TextAsset\\SystemText_en`;



// console.log('done');