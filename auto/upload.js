const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const sizeCachePath = path.resolve(__dirname, './cloudinary_images_sizecache.json');
const sizeCache = fs.existsSync(sizeCachePath) ? require(sizeCachePath) : {};

if (!process.env.CLOUDINARY_URL) {
    const secret = require('./secret.json');
    cloudinary.config({
        cloud_name: secret.cloud_name,
        api_key: secret.api_key,
        api_secret: secret.api_secret
    });
}

module.exports = { uploadImageFromPath, sortSizeCache, saveSizeCache };

/**
 * Uploads an image to Cloudinary from file system.
 * @param {string} imagePath 
 * @param {string} folder 
 * @param {string?} altName without file extension
 * @returns {boolean} success or failure depending on if the image was uploaded or not
 */
async function uploadImageFromPath(imagePath, folder, imageName=undefined) {
    if (!fs.existsSync(imagePath)) {
        console.error("Image doesn't exist at path: " + imagePath);
        return false;
    }
    
    // Check if image already exists
    const imageSize = fs.statSync(imagePath).size;
    if (existsInSizeCache(imageName || imagePath, imageSize, folder)) {
        return false;
    }

    try {
        await cloudinary.uploader.upload(imagePath, {
            folder: folder,
            public_id: imageName,
            use_filename: true,
            unique_filename: false,
            overwrite: true
        });
        
        addSizeCache(imageName || imagePath, imageSize, folder);
        return true;
    } catch(e) {
        console.log(`Image upload failed for ${imagePath}`);
        console.log(e);
        return false;
    }
}

/**
 * Checks if an image name/size already exists in the size cache.
 * @param {string} imageName 
 * @param {number} imageSize 
 * @param {string} folderStr 
 * @returns {boolean} true if image name and size already exists in size cache
 */
function existsInSizeCache(imageName, imageSize, folderStr) {
    imageName = path.basename(imageName, path.extname(imageName)); // remove extension

    if (sizeCache[folderStr] && sizeCache[folderStr][imageName] && sizeCache[folderStr][imageName] === imageSize) {
        return true;
    } else {
        return false;
    }
}

function addSizeCache(imageName, imageSize, folderStr) {
    imageName = path.basename(imageName, path.extname(imageName)); // remove extension
    if (!sizeCache[folderStr]) sizeCache[folderStr] = {};
    sizeCache[folderStr][imageName] = imageSize;
}

function sortSizeCache(folderStr, sortFunction=undefined) {
    if (!sizeCache[folderStr]) return;

    if (sortFunction === undefined) {
        sortFunction = (a, b) => {
            return a[0].localeCompare(b[0]);
        };
    }

    sizeCache[folderStr] = Object.entries(sizeCache[folderStr]).sort(sortFunction).reduce((accum, prop) => {
        accum[prop[0]] = prop[1];
        return accum;
    }, {});
}

/**
 * 
 */
function saveSizeCache() {
    fs.mkdirSync(path.dirname(sizeCachePath), { recursive: true });
    fs.writeFileSync(sizeCachePath, JSON.stringify(sizeCache, null, '\t'));
}
