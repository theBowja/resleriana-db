const fs = require('fs');
const https = require('https');
const config = require('./config.json');

const CATALOG_PATH = "C:/Program Files (x86)/Steam/steamapps/common/AtelierReslerianaGL/AtelierResleriana_Data/ABCache/content_catalogs/1708581545__gq4QN14Pa_CUofd_catalog.json";


// getImageResourcesSteam(CATALOG_PATH);
getImageResourcesAndroid(config.fileassets_version.Global, `./images/still_path_hash_global.txt`);


function getImageResourcesSteam(CATALOG_PATH) {
    const catalogData = require(CATALOG_PATH);
    getImageResources(catalogData, 'Steam', ['Texture2D']);
}

async function getImageResourcesAndroid(version, filterPath=undefined) {
    const catalogJSON = await downloadCatalog(version, 'Android');
    let filterLabels = undefined;
    if (filterPath) filterLabels = fs.readFileSync(filterPath).toString().split('\n');

    
    getImageResources(catalogJSON, 'Android', ['Texture2D'], filterLabels);
}

/**
 * Get the resource data of all Texture2D resources.
 * @param {string} catalogJSON
 * @param {string} platform 
 * @param {string[]} filterResourceTypes array of unity resource types to filter on
 * @param {string[]} filterLabels array of path hashes from the masterdata
 */
function getImageResources(catalogJSON, platform='StandaloneWindows64', filterResourceTypes=['Texture2D'], filterLabels=undefined) {
    const keys = getKeys(catalogJSON);
    const buckets = getBuckets(catalogJSON);
    const entries = getEntries(catalogJSON, keys);
    const resources = getResources(catalogJSON, keys, buckets, entries, platform, filterResourceTypes, filterLabels, true, true);
    
    // fs.writeFileSync(outputPath, JSON.stringify(resources, null, '\t'));

    // generate list of bundle names
    const bundleNames = new Set();
    for (const resource of Object.values(resources)) {
        for (const entry of resource) {
            bundleNames.add(entry.filename);
        }
    }

    const filterString = filterResourceTypes.map(s => s.toLowerCase()).sort().join();
    const subset = filterLabels ? 'filtered' : 'all';
    fs.writeFileSync(`./images/bundlenames_${platform.toLowerCase()}_${subset}_${filterString}.txt`, Array.from(bundleNames).sort().join('\n'));

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

        fs.writeFileSync(`./images/container_to_path_hash.json`, JSON.stringify(pathHashContainerMap, null, '\t'));
    }
}

async function downloadCatalog(version, platform) {
    const url = `https://asset.resleriana.com/asset/${version}/${platform}/catalog.json`;
    return JSON.parse(await sendHttpRequest(url));
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

function getEntries(catalog, keys) {
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
        const dependencyKey = keys[dependencyKeyIndex];
        const depHash = entriesBuffer.readInt32LE(offset+12);
        const dataIndex = entriesBuffer.readInt32LE(offset+16);
        const primaryKey = entriesBuffer.readInt32LE(offset+20);
        const primary = keys[primaryKey];
        const resourceTypeIndex = entriesBuffer.readInt32LE(offset+24); // m_resourceTypes
        const resourceType = catalog.m_resourceTypes[resourceTypeIndex].m_ClassName;
        offset += 28;
        if (dataIndex < 0) {
            entries.push({ container, dependencyKey, primary, resourceTypeIndex, resourceType });
        } else {
            const { newOffset, data } = readObjectFromData(extrasBuffer, dataIndex);
            entries.push({ container, dependencyKey, primary, resourceTypeIndex, resourceType, data });
        }
    }

    return entries;
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
function getResources(catalog, keys, buckets, entries, platform='Steam', filterResourceTypes=undefined, filterLabels=undefined, bundlesOnly=false, addFileName=false) {
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
                        if (platform === 'Steam') {
                            entry.filename = `${pathBundleMap[entry.dependencyKey]._bundleName}_${pathBundleMap[entry.dependencyKey]._hash}`;
                        } else if (platform === 'Android') {
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