// Helper script to map "npm run [script]" calls to various functions of interest.

const fs = require('fs');
const path = require('path');

const catalog = require('../import/catalog.js');
const tools = require('../tools/tools.js');
const unpackTextAssets = require('../import/unpackTextAssets.js');

const importconfig = require('../import/config.json');

module.exports = { extractImages, extractTextAsset, extractAudioClip };

async function extractImages(server="Global", platform="StandaloneWindows64", version=importconfig.fileassets_version[server],
    {
        imageFormat="webp", outputFolder=undefined, skipOutputFolder=false, imageNamesOutputPath=undefined,
        skipDownloads=false, regexFilter=undefined
    } = {}
) {
    console.log(`${server} | ${platform} | ${version}`);
    console.log(`Script started: extractImages`);
    const t0 = performance.now();
        
    // Variables
    const bundleDir = path.resolve(__dirname, `../resources/${server}/${platform}/bundles`);
    const bundleNamesTexture2D = path.resolve(__dirname, `../resources/${server}/${platform}/bundlenames_all_texture2d.txt`);
    if (skipOutputFolder) outputFolder = undefined;
    else if (outputFolder === undefined) outputFolder = path.resolve(__dirname, `../resources/${server}/${platform}/Texture2D`);
    if (!imageNamesOutputPath)
        imageNamesOutputPath = path.resolve(__dirname, `../resources/${server}/${platform}/filenames_${regexFilter ? 'regex' : 'all'}_texture2d.txt`);

    if (!skipDownloads) {
        // Download catalog
        const catalogJSON = await catalog.getCatalogFromDownload(server, version, platform);
        catalog.getCatalogResources(server, catalogJSON, platform, 'Texture2D');

        // Download bundles
        tools.executeAtelierToolBundleDownload(server, platform, version, bundleDir, bundleNamesTexture2D);
    }

    // Export assets
    tools.exportAssets(bundleNamesTexture2D, bundleDir, 'Texture2D',
        { output_folder: outputFolder, filename_list: imageNamesOutputPath, image_format: imageFormat, regex: regexFilter });
    
    const t1 = performance.now();
    console.log(`Completed script extractImages in ${(t1-t0)/1000} seconds`)
}

// Export TextAsset to resources folder
async function extractTextAsset(server="Global", platform="Android", version=importconfig.fileassets_version[server],
    {
        outputFolder=undefined,
        processes=undefined
    } = {}
) {
    console.log(`${server} | ${platform} | ${version}`);
    console.log(`Script started: extractTextAsset`);
    const t0 = performance.now();

    // Download catalog
    const catalogJSON = await catalog.getCatalogFromDownload(server, version, platform);
    catalog.getCatalogResources(server, catalogJSON, platform, 'TextAsset');

    // Variables
    const bundleDir = path.resolve(__dirname, `../resources/${server}/${platform}/bundles`);
    const bundleNamesTextAsset = path.resolve(__dirname, `../resources/${server}/${platform}/bundlenames_all_textasset.txt`);
    const textAssetByteDir = path.resolve(__dirname, `../resources/${server}/${platform}/TextAssetBytes`);
    if (outputFolder === undefined) outputFolder = path.resolve(__dirname, `../resources/${server}/TextAsset`);

    tools.executeAtelierToolBundleDownload(server, platform, version, bundleDir, bundleNamesTextAsset);
    tools.exportAssets(bundleNamesTextAsset, bundleDir, 'TextAsset', { output_folder: textAssetByteDir, processes: processes });
    unpackTextAssets.unpackFolder(textAssetByteDir, outputFolder, true);

    const t1 = performance.now();
    console.log(`Completed script extractTextAsset in ${(t1-t0)/1000} seconds`)
}

/**
 * Export AudioClip to resources folder
 * @param {'Global'|'Japan'} server
 * @param {'StandaloneWindows64'|'Android'|'iOS'} platform
 * @param {'SoundSetting'|'VoiceSetScriptableObject'} type 
 */
async function extractAudioClip(server="Global", platform="StandaloneWindows64", version=importconfig.fileassets_version[server], type='SoundSetting',
    { redoCache=false, skipDownloads=false, processes=undefined, outputFolder=undefined, skipOutputFolder=false, regexFilter=undefined } = {}) {
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
    if (skipOutputFolder) outputFolder = undefined;
    else if (outputFolder === undefined) outputFolder = path.resolve(__dirname, `../resources/${server}/${platform}/${type}`);
    const filenamesPath = path.resolve(__dirname, `../resources/${server}/${platform}/filenames_all_${type.toLowerCase()}.txt`);
    const cachedPath = path.resolve(__dirname, `../resources/${server}/${platform}/cache_${type.toLowerCase()}.json`);

    if (redoCache) {
        // Download the bundles
        tools.executeAtelierToolBundleDownload(server, platform, version, bundleDir, bundleNamesAllPath);
        // Extract resources from the bundles
        tools.exportAssets(bundleNamesAllPath, bundleDir, 'AudioClip',
            { output_folder: outputFolder, filename_list: filenamesPath, regex: regexFilter, bundlename_list: bundleNamesCachePath, processes: processes });
    
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
        tools.exportAssets(bundleNamesCachePath, bundleDir, 'AudioClip',
            { output_folder: outputFolder, filename_list: filenamesPath, regex: regexFilter, bundlename_list: bundleNamesCachePath, processes: processes });
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