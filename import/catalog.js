const fs = require('fs');
const path = require('path');
const https = require('https');
const config = require('./config.json');

module.exports = {
    getCatalogFromDownload, getCatalogFromLocalFile,
    getFilterLabels,
    getCatalogResources
};

// const CATALOG_PATH = "C:/Program Files (x86)/Steam/steamapps/common/AtelierReslerianaGL/AtelierResleriana_Data/ABCache/content_catalogs";
// const STILL_PATH_HASH_PATH = path.resolve(__dirname, '../resources/Global/still_path_hash.txt');

/**
 * Helper function to retrieve catalog json from the internet.
 * @param {string} server 
 * @param {string} version 
 * @param {string} platform 
 * @param {boolean} useCache whether or not to cache the catalog
 * @returns {object} catalog json
 */
async function getCatalogFromDownload(server, version, platform='StandaloneWindows64', useCache=true) {
    return await downloadCatalog(server, version, platform, useCache);
}

/**
 * Helper function to retrieve catalog json from a local file. The file must end with '_catalog.json'
 * @param {string} catalogFilePath 
 * @returns {object} catalog json
 */
function getCatalogFromLocalFile(catalogFilePath) {
    catalogFilePath = path.resolve(process.cwd(), catalogFilePath);
    let catalogData = undefined;
    if (catalogFilePath.endsWith('_catalog.json')) {
        catalogData = require(catalogFilePath);
    } else if (fs.lstatSync(catalogFilePath).isDirectory()) { // look for the catalog file
        const filenames = fs.readdirSync(catalogFilePath);
        for (const filename of filenames) {
            if (filename.endsWith('_catalog.json')) {
                catalogData = require(path.join(catalogFilePath, filename));
                break;
            }
        }
    } 
    if (catalogData === undefined) {
        throw new Error('Invalid catalog file path provided');
    }
    return catalogData;
}

/**
 * Helper function to retrieve filter labels from a file.
 * @param {string} filterPath if relative path, then it is relative to current working directory.
 * @returns {string[]}
 */
function getFilterLabels(filterPath) {
    filterPath = path.resolve(process.cwd(), filterPath);
    return fs.readFileSync(filterPath).toString().split(/\r\n|\n|\r/);
}

/**
 * Get the resource data, save the list of bundle names that contain the filtered resource type,
 * and save the container to path hash map.
 * @param {string} server
 * @param {string} catalogJSON
 * @param {string} platform 
 * @param {string} filterResourceTypes unity resource types to filter on
 * @param {string[]} [filterLabels] array of path hashes from the masterdata
 */
function getCatalogResources(server, catalogJSON, platform='StandaloneWindows64', filterResourceTypes='Texture2D', filterLabels=undefined) {
    validateServer('getCatalogResources', server);
    console.log('Extracting resource data from catalog');
    const t0 = performance.now();

    const keys = getKeys(catalogJSON);
    const buckets = getBuckets(catalogJSON);
    const entries = getEntries(catalogJSON, keys, buckets);
    fixDependencyKey(entries, keys, buckets);
    // const extras = getExtras(catalogJSON);
    const resources = getResources(catalogJSON, keys, buckets, entries, platform, [filterResourceTypes], filterLabels, false, true);

    // DEBUG
    // fs.mkdirSync(path.resolve(__dirname, `../resources/${server}/${platform}/catalog`), { recursive: true }); // debug
    // fs.writeFileSync(path.resolve(__dirname, `../resources/${server}/${platform}/catalog/keys.json`), JSON.stringify(keys, null, '\t')); // debug
    // fs.writeFileSync(path.resolve(__dirname, `../resources/${server}/${platform}/catalog/buckets.json`), JSON.stringify(buckets, null, '\t')); // debug
    // fs.writeFileSync(path.resolve(__dirname, `../resources/${server}/${platform}/catalog/entries.json`), JSON.stringify(entries, null, '\t')); // debug
    // // fs.writeFileSync(path.resolve(__dirname, `../resources/${server}/${platform}/catalog/extras.json`), JSON.stringify(extras, null, '\t')); // debug
    // fs.writeFileSync(path.resolve(__dirname, `../resources/${server}/${platform}/catalog/resources.json`), JSON.stringify(resources, null, '\t')); // debug
    // fs.mkdirSync(path.resolve(__dirname, `../resources/${server}/${platform}`), { recursive: true });

    // generate list of bundle names
    const bundleNames = new Set();
    for (const resource of Object.values(resources)) {
        for (const entry of resource) {
            bundleNames.add(entry.filename);
        }
    }

    const subset = filterLabels ? '_filtered' : '';
    fs.writeFileSync(path.resolve(__dirname, `../resources/${server}/${platform}/bundlenames/${filterResourceTypes}_catalog${subset}.txt`),
                     Array.from(bundleNames).filter(e => e).sort().join('\n'));

    if (filterLabels) {
        const pathHashContainerMap = {};
        for (const label of filterLabels) {
            if (!resources[label]) {
                console.log(`resources is missing ${label}`);
                continue;
            } else if (pathHashContainerMap[resources[label][0].container]) {
                console.log(`path_hash has duplicated containers ${resources[label][0].container}`);
                continue;
            }

            pathHashContainerMap[resources[label][0].container] = label;
        }

        fs.writeFileSync(path.resolve(__dirname, `../resources/${server}/container_to_path_hash.json`),
                         JSON.stringify(pathHashContainerMap, null, '\t'));
    }
    const t1 = performance.now();
    console.log(`  Finished extracting resource data in ${(t1-t0)/1000} seconds`);
}

/**
 * Check if the server is valid (found in config). Throws an error if invalid server.
 * @param {string} callerName for error message
 * @param {string} server 
 */
function validateServer(callerName, server) {
    if (!config.servers.includes(server)) throw new Error(`${callerName} was not provided a valid server ${server}. It must be one of: ${config.servers.join(', ')}`);
}

let catalogCache;
let cacheHash;
async function downloadCatalog(server, version, platform, useCache=true) {
    if (useCache && catalogCache && cacheHash === server+version+platform) {
        console.log(`Returning cached catalog (${cacheHash}) from previous download`);
        return catalogCache;
    }

    console.log(`Downloading catalog for ${server} ${platform} ${version}`);
    const t0 = performance.now();

    const domain = server === 'Global' ? 'com' : 'jp';
    const url = `https://asset.resleriana.${domain}/asset/${version}/${platform}/catalog.json`;
    const result = JSON.parse(await sendHttpRequest(url));
    
    const t1 = performance.now();
    console.log(`  Finished downloading catalog in ${(t1 - t0)/1000} seconds`)

    if (useCache) {
        catalogCache = result;
        cacheHash = server+version+platform;
    }
    return result;
}

function sendHttpRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Error fetching data: ${url}`));
                return;
            }

            let data = [];
            response.on('data', (chunk) => {
                data.push(chunk);
            });
            response.on('end', () => {
                resolve(Buffer.concat(data));
            });
        }).on('error', reject);
    });
}

/**
 * Deserializes m_KeyDataString
 * @param {*} catalog 
 */
function getKeys(catalog) {
    const keys = [];

    const keysBuffer = Buffer.from(catalog.m_KeyDataString, 'base64');
    const count = keysBuffer.readInt32LE(0);

    let offset = 4;
    for (let i = 0; i < count; i++) {
        const type = keysBuffer[offset];
        offset++;
        switch (type) { // https://github.com/AssetRipper/AssetRipper/blob/master/Source/AssetRipper.Addressables/ObjectType.cs
            case 0: { // AsciiString
                const length = keysBuffer.readInt32LE(offset);
                offset += 4;
                const value = keysBuffer.subarray(offset, offset+length).toString('ascii');
                offset += length;
                keys.push(value);
                break;
            }
            case 4: { // Int32
                const value = keysBuffer.readInt32LE(offset);
                offset += 4;
                keys.push(value);
                break;
            }
            default:
                console.log(`Unimplemented type ${type} for getKeys. Please see https://github.com/AssetRipper/AssetRipper/blob/master/Source/AssetRipper.Addressables/Serialization.cs ReadObjectFromData for implementation.`);
                continue;
        }
    }
    return keys;
}

function getBuckets(catalog) {
    const buckets = [];

    const bucketsBuffer = Buffer.from(catalog.m_BucketDataString, 'base64');
    const count = bucketsBuffer.readInt32LE(0);
    let offset = 4;
    for (let i = 0; i < count; i++) {
        const index = bucketsBuffer.readInt32LE(offset);
        offset += 4;
        const entryCount = bucketsBuffer.readInt32LE(offset);
        offset += 4;

        const entries = [];
        for (let j = 0; j < entryCount; j++) {
            const value = bucketsBuffer.readInt32LE(offset);
            offset += 4;
            entries.push(value);
        }

        buckets.push({ index, entries });
    }

    return buckets;
}

function getExtras(catalog) {
    const extras = [];

    const extrasBuffer = Buffer.from(catalog.m_ExtraDataString, 'base64');
    let offset = 0;
    while (offset < extrasBuffer.length) {
        const { newOffset, data } = readObjectFromData(extrasBuffer, offset);
        offset = newOffset;
        extras.push(data);
    }

    return extras;
}

// https://github.com/needle-mirror/com.unity.addressables/blob/45b4451e40efabef100e41f269d8a50b16e33402/Runtime/ResourceLocators/ContentCatalogData.cs#L530
function getEntries(catalog, keys, buckets) {
    const entries = [];

    const entriesBuffer = Buffer.from(catalog.m_EntryDataString, 'base64');
    const extrasBuffer = Buffer.from(catalog.m_ExtraDataString, 'base64');
    const count = entriesBuffer.readInt32LE(0);
    let offset = 4;
    for (let i = 0; i < count; i++) {
        const internalId = entriesBuffer.readInt32LE(offset);
        const container = catalog.m_InternalIds[internalId];
        const providerIndex = entriesBuffer.readInt32LE(offset+4);
        const provider = catalog.m_ResourceProviderData[providerIndex].m_Id;
        const dependencyKeyIndex = entriesBuffer.readInt32LE(offset+8);
        // if (dependencyKeyIndex < 0) console.log('something has gone awry with dependencyKeyIndex'); // idk man
        const dependencyKey = keys[dependencyKeyIndex];
        const depHash = entriesBuffer.readInt32LE(offset+12);
        const dataIndex = entriesBuffer.readInt32LE(offset+16);
        const primaryKey = entriesBuffer.readInt32LE(offset+20);
        const primary = keys[primaryKey];
        const resourceTypeIndex = entriesBuffer.readInt32LE(offset+24); // m_resourceTypes
        const resourceType = catalog.m_resourceTypes[resourceTypeIndex].m_ClassName;
        offset += 28;
        if (dataIndex < 0) {
            entries.push({ container, dependencyKey, depHash, primary, resourceTypeIndex, resourceType });
        } else {
            const { newOffset, data } = readObjectFromData(extrasBuffer, dataIndex);
            entries.push({ container, dependencyKey, depHash, primary, resourceTypeIndex, resourceType, data });
        }
    }

    return entries;
}

/**
 * Sometimes entry.dependencyKey might be a number.
 * This means there are multiple bundles associated with this entry.
 * We'll just use the first bundle. Surely it'll be enough.
 */
function fixDependencyKey(entries, keys, buckets) {
    for (const entry of entries) {
        if (typeof entry.dependencyKey === 'number') {
            const keyIndex = keys.indexOf(entry.dependencyKey);
            entry.dependencyKey = entries[buckets[keyIndex].entries[0]].primary;
        }
    }
}

/**
 * 
 * @param {Buffer} dataBuffer 
 * @param {*} offset 
 * @returns {{ newOffset, data }} returns an object containing the new offset and the data
 */
function readObjectFromData(dataBuffer, offset) {
    const type = dataBuffer[offset];
    offset++;
    switch (type) { // https://github.com/AssetRipper/AssetRipper/blob/master/Source/AssetRipper.Addressables/ObjectType.cs
        case 0: { // AsciiString
            const length = dataBuffer.readInt32LE(offset);
            offset += 4;
            const value = dataBuffer.subarray(offset, offset+length).toString('ascii');
            offset += length;
            return { newOffset: offset, data: value };
        }
        case 1: { // UnicodeString
            const length = dataBuffer.readInt32LE(offset);
            offset += 4;
            const value = dataBuffer.subarray(offset, offset+length).toString('utf16le');
            offset += length;
            return { newOffset: offset, data: value };
        }
        case 4: { // Int32
            const value = dataBuffer.readInt32LE(offset);
            offset += 4;
            return { newOffset: offset, data: value };
        }
        case 7: { // JsonObject
            const assemblyNameLength = dataBuffer[offset];
            offset++;
            const assemblyName = dataBuffer.subarray(offset, offset+assemblyNameLength).toString('ascii');
            offset += assemblyNameLength;

            const classNameLength = dataBuffer[offset];
            offset++;
            const className = dataBuffer.subarray(offset, offset+classNameLength).toString('ascii');
            offset += classNameLength;

            const jsonLength = dataBuffer.readInt32LE(offset);
            offset += 4;
            const jsonText = dataBuffer.subarray(offset, offset+jsonLength).toString('utf16le');
            offset += jsonLength;

            // if (JSON.stringify(JSON.parse(jsonText)) !== jsonText) {
            //     console.log('bigint data detect. please use json-bigint package to parse json');
            // }
            return { newOffset: offset, data: JSON.parse(jsonText) };
        }
        default:
            console.log(`Unimplemented type ${type} for getKeys. Please see https://github.com/AssetRipper/AssetRipper/blob/master/Source/AssetRipper.Addressables/Serialization.cs ReadObjectFromData for implementation.`);
            throw new Error();
    }
}

/**
 * 
 * @param {*} catalog 
 * @param {*} keys 
 * @param {*} buckets 
 * @param {*} entries 
 * @param {string[]} filterResourceTypes which unity resources to filter. found inside `catalog.m_resourceTypes`. example: `['texture2d', 'sprite', 'textasset']`
 * @param {boolean} bundlesOnly only include resource data which can be found in `catalog._fileCatalog._bundles[]._relativePath`
 * @param {boolean} addFileName adds the encrypted steam asset's file name to each resource data. it's just `_bundleName+'_'+_hash`.
 * @returns 
 */
function getResources(catalog, keys, buckets, entries, platform='StandaloneWindows64', filterResourceTypes=undefined, filterLabels=undefined, bundlesOnly=false, addFileName=false) {
    const result = {};

    if (filterLabels) filterLabels = new Set(filterLabels);

    // convert filterResourceTypes to index
    if (filterResourceTypes) {
        filterResourceTypes = filterResourceTypes.map(frt => catalog.m_resourceTypes.findIndex(rt => rt.m_ClassName.toLowerCase().includes(frt.toLowerCase())) ).filter(frti => frti !== -1);
    }

    // create a mapping of bundle names to their bundle data
    let pathBundleMap = {};
    if (addFileName) {
        catalog._fileCatalog._bundles.forEach(bundleData => {
            pathBundleMap[bundleData._relativePath] = bundleData;
        });
    }

    for (let i = 0; i < buckets.length; i++) {
        if (typeof keys[i] === 'string') {
            const locations = [];
            for (const bucketEntry of buckets[i].entries) {
                const entry = entries[bucketEntry];
                let canAdd = true;

                if (filterResourceTypes && !filterResourceTypes.includes(entry.resourceTypeIndex)) {
                    canAdd = false;
                } else if (bundlesOnly && (!entry.dependencyKey || !pathBundleMap[entry.dependencyKey])) {
                    canAdd = false;
                } else if (filterLabels && !filterLabels.has(entry.primary)) {
                    canAdd = false;
                }

                if (canAdd) {
                    if (addFileName && pathBundleMap[entry.dependencyKey]) {
                        if (platform === 'StandaloneWindows64') {
                            entry.filename = `${pathBundleMap[entry.dependencyKey]._relativePath}`;
                            // below is for local steam files
                            // entry.filename = `${pathBundleMap[entry.dependencyKey]._bundleName}_${pathBundleMap[entry.dependencyKey]._hash}`;
                        } else {
                            entry.filename = `${pathBundleMap[entry.dependencyKey]._relativePath}`;
                        }
                    }

                    locations.push(entry);
                }
            }

            if (locations.length !== 0) {
                result[keys[i]] = locations;
            }
        }
    }

    return result;
}