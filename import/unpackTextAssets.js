const fs = require('fs');
const path = require('path');
BigInt.prototype.toJSON = function() { return this.toString(); }

module.exports = { unpackFolder };

/**
 * Unpacks every file in the inputDir to json and writes it to outputDir.
 * @param {string} inputDir if relative path, then it is relative to current working directory.
 * @param {string} outputDir if relative path, then it is relative to current working directory.
 */
function unpackFolder(inputDir, outputDir) {
    inputDir = path.resolve(process.cwd(), inputDir);
    outputDir = path.resolve(process.cwd(), outputDir);

    const filenames = fs.readdirSync(inputDir);
    for (const filename of filenames) {
        const file = fs.readFileSync(path.join(inputDir, filename));

        const entries = unpackTextAsset(file);

        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(path.join(outputDir, `${filename}.json`), JSON.stringify(entries, null, '\t'));
    }    
}

// Maps property keys to understandable keys
const propNameMap = {
    4092729604: 'id',
    2072370017: 'translated_name',
    3013568853: 'idk_name',
    2314468669: 'model_path_hash',
    999008199: 'text',
    1924308541: 'voice_file',
    3411751622: 'still_path_hash',
    397529648: 'speech_balloon_type_id',
    default: 'unknown'
};

/**
 * Unpacks a TextAsset bytes file into an array.
 * @param {Buffer} file 
 * @param {string} debugName 
 * @returns {object[]} data
 */
function unpackTextAsset(file, debugName) {
    let offset = 0;

    // read metadata
    const propCount = file.readUInt32LE(offset); // number of properties
    offset+=4;
    const entryCount = file.readUInt32LE(offset); // array length
    offset+=4;

    // read property metadata
    const props = [];
    for (let i = 0; i < propCount; i++) {
        const prop = {};
        prop.type = file.readUInt32LE(offset);
        offset+=4;
        const propId = file.readUInt32LE(offset);
        if (propNameMap[propId]) prop.name = propNameMap[propId];
        else prop.name = `${propNameMap.default}_${propId}`;
        offset+=4;
        props.push(prop);
    }

    // read data
    const entries = [];
    for (let i = 0; i < entryCount; i++) {
        const entry = {};
        for (const prop of props) {
            switch (prop.type) {
                case 0: // int32
                    entry[prop.name] = file.readUInt32LE(offset);
                    offset+=4
                    break;
                case 1: // int64
                    entry[prop.name] = file.readBigUInt64LE(offset);
                    offset+=8;
                    break;
                case 2: // string
                    const strLen = file.readUInt32LE(offset);
                    offset+=4;
                    entry[prop.name] = file.subarray(offset, offset+strLen).toString('utf8');
                    offset+=strLen;
                    break;
                default:
                    console.log(`unpackTextAsset: unhandled property type ${prop.type} for file ${debugName}`);
            }
        }
        entries.push(entry);
    }

    return entries;
}