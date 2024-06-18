# resleriana-db

This repository provides easy access to all the resources required for creating your own project for Atelier Resleriana.

Provided from repository, web API, and npm package:
- masterdata data (contains game data)
- parsed data (contains curated data from masterdata)
- TextAsset data (contains story dialogue, SystemText, etc.)

Provided from repository:
- built-in scripts to extract your own images, voiceclips, and videos
- mapping for converting `_still_path_hash` in masterdata to extracted image names
- upload images directly to Cloudinary CDN
- preview newly added images

Provided from Cloudinary CDN:
- all images for Global version
- all images for Japan version

## Table of Contents
- [Local development](#local-development)
- [Respository structure](#repository-structure)
- [Get data](#get-data)
  - [from repository](#from-repository)
  - [from npm package](#from-npm-package)
  - [from web API](#from-web-api)
- [Extract resources](#extract-resources)
  - [Texture2D](#extract-texture2d)
  - [AudioClip](#extract-audioclip)
  - [VideoClip](#extract-videoclip)
- [Preview](#preview)
- [Contributing](#contributing)

## Local Development

Everything you'll need to run the built-in scripts locally.

Clone the repository:
```
git clone https://github.com/theBowja/resleriana-db.git
```

Install Node.js v20+:  
https://nodejs.org/en/download

Verify Node.js and npm installation:
```
node --version
npm --version
```

Install npm package dependencies:
```
cd path/to/resleriana-db
npm install
```

Install .NET 7.0 (required for the bundle downloader/decrypter):  
https://dotnet.microsoft.com/en-us/download/dotnet/7.0

Verify .NET installation:
```
dotnet --version
dotnet --list-runtimes
```

Install Python 3.7+ (required for UnityPy asset extraction):  
https://www.python.org/downloads/

Verify Python installation:
```
python --version
pip --version
```

Install python package dependencies:
```
pip install -r requirements.txt
```

## Repository structure
- `/api` - Contains the code for Vercel API.
- `/auto` - Contains code used by Github Actions to auto-update data and auto-upload assets to Cloudinary CDN.
- `/data` - Contains the masterdata, parsed, and TextAsset JSON organized by locales.
- `/dist` - TODO for npm publishing.
- `/import` - Contains the helper scripts used to download catalog, extract resource metadata, extract and parse masterdata, and deserialize TextAssets.
- `/resources` - 
- `/types` - TODO
- `main.mjs` - Script contains the data retrieval and data searching functions.

### master

This dataset contains the original data directly used in the game.

### parsed

This dataset contains files and data properties curated from the master data.

## Get data

JSON data is divided into datasets and locale.  

Datasets: master, parsed  
Locales: en, jp, zh-cn, zh-tw  

Datasets: TextAsset  
Locales: Global, Japan   

Note: master data contains some properties that end in `_still_path_hash`. These can be mapped to actual image names using the JSON map at [/resources/Global/path_hash_to_name.json](./resources/Global/path_hash_to_name.json).

### From repository

JSON data is stored in the `/data/[dataset]/[locale]` folder and can be 

Alternatively, you can import the following functions from the main.mjs file:
- getFile(dataset, locale, file)
- getDataByKey(dataset, locale, file, key, value)
- searchData(dataset, locale, files, keys, query, options={})

Documentation for these functions can be found in the [next section](#from-npm-package).

### From npm package

JSON data for master, parsed, and TextAsset can be downloaded as an npm package for your JavaScript project. The size of the JSONs combined is 70MB+ or 5MB+ compressed. Please refrain from loading the entire package directly into your HTML because that will directly ruin your loading times.

```
npm install resleriana-db
```

You can directly load JSONs from your node_modules folder using the following path: `/node_modules/resleriana-db/data/[dataset]/[locale]/[file].json`.

However it is recommended you import the `resleriana-db` module in order to access the JSON data.

```js
const reslerianaDb = require('resleriana-db');
```

The module exports the following helper functions:

- [getFile(dataset, locale, file)](#getfile)
- [getDataByKey(dataset, locale, file, key, value)]()
- [searchData(dataset, locales, files, keys, query, options={})]()

#### getFile

TODO

#### getDataByKey

TODO

#### searchData

TODO

### From web API

The web API is hosted on Vercel serverless functions. Access to Vercel servers may not be supported in non-US regions, but it is very easy to set up your own API. The routes in `/api` folder map directly to functions exported in the `main.mjs` script.

The APIs are split into two different types: [retrieval](#data-retrieval-api) and [searching](#data-searching-api).

### Data retrieval API

#### GET: /api/{dataset}/{locale}/{file}
Returns the JSON data file for the given dataset, locale, and filename. Returns *undefined* if there is no result.

Examples:  
- https://resleriana-db.vercel.app/api/master/en/base_character

#### GET: /api/{dataset}/{locale}/{file}/{key}
Returns the *first* subdata object that matches the same key and value. Returns *undefined* if there is no result.

Required query parameters:  
- **value** *{string}* - Value to match.

Examples:  
- https://resleriana-db.vercel.app/api/master/en/character/id?value=43101

### Data searching API

Searching functionality uses fuzzy search from the [uFuzzy](https://github.com/leeoniya/uFuzzy) library which provides auto-complete functionality.

#### GET: /api/{dataset}/search
Searches through multiple locales, files, and keys to find the best match for the search query. If **topResultOnly** is *true*, then returns the search object or *undefined* for no result. If **topResultOnly** is *false*, then returns ??? array of search objects or empty array for no result.

Required query parameters:  
- **locale** *{string}* - Comma-separated list of locales to search in.  
- **file** *{string}* - Comma-separated list of files to search in. Do not include `.json`.  
- **key** *{string}* - Comma-separated list of keys to search in.  
- **query** *{string}* - The search query.  

Optional query parameters:
- **firstResultOnly** *{boolean?}* - Default true.  
- **numberOfResults** *{number?}* - Default -1. If topResultOnly is set to false, then this API will return an  
- **multiKeyLogic** *{string?}* - Default "AND".  
- **resultLocale** *{string?}* - Default undefined.  
- **activeOnly** *{boolean?}* - Default true. Whether or not to include data where the current time is not between the `start_at` or `end_at` properties.

Returned search object:
- a

Examples:  
- https://resleriana-db.vercel.app/api/master/search?locale=en&file=character&key=name&query=resna  
- https://resleriana-db.vercel.app/api/parsed/search?locale=en&file=material&key=equipment_trait.name,equipment_trait.name&query=physical%20res,%20magic%20res  

## Extract resources

This repository provides npm run-scripts for extracting the following UnityAssets: Texture2D, Sprite, AudioClip, VideoClip.

### Extract Texture2D

Prerequisite: [Set up local environment](#local-development).  

You can use the `extractImages` npm run-script to extract all images. TODO describe what it does. it downloads. This run-script can be configured with various options.

Example:
```powershell
npm run extractImages --% -- --imagesOutputFolder "../MyReslerApp/images" --regex "(^STL_P_.*)|(^equipment_.*)|(^battle_tool.*)"
```

Optional arguments:
- [--server](#server)
- [--platform](#platform)
- [--imagesOutputFolder](#imagesoutputfolder)
- [--imageFormat](#imageformat)
- [--skipDownloads](#skipdownloads)
- [--regex](#regex)

#### --server

Which server to download Unity bundles for.

Options: "Global" and "Japan"  
Default: "Global"

Example:
```powershell
npm run extractImages --% -- --server "Japan"
```

#### --platform

Which platform to download Unity bundles for.

Options: "StandaloneWindows64", "Android", and "iOS"  
Default: "StandaloneWindows64"

The images from "StandaloneWindows64" will be of noticeable higher quality than images from the mobile platforms.

```powershell
npm run extractImages --% -- --platform "Android"
```

#### --imagesOutputFolder

Path to the folder where the images will be outputted.

Default: "./resources/[server]/[platform]/Texture2D"

 If it is a relative path, then it will be relative to the current working directory.

```powershell
npm run extractImages --% -- --imagesOutputFolder "./path/to/wherever"
```

#### --imageFormat

Format of the image to convert to.

Options: "png" and "webp"  
Default: "webp"

Assets inside Unity bundles are in a compressed format like BC7. They are decompressed into RGBA before being converted into a more common format. This conversion step can be time-consuming, especially for large batches of images. Processing over 2,000 images might take more than a minute.

Currently, png images are double the size of webp images. Webp images will go through lossy conversion. You can change the quality of the conversion by modifying the python script at `./tools/UnityPyScripts/exportAssets.py`.

```powershell
npm run extractImages --% -- --imageFormat "png"
```

#### --skipDownloads

Whether or not to skip downloading the catalog and bundles.

Default: false

This is useful for saving time if you've already downloaded the catalog and bundles from running the command previously and know that the game has not been updated since. The script downloads the catalog in order to create a list of Unity bundles that contain Texture2D assets. This is list is saved in the file: `./resources/[server]/[platform]/bundlenames_all_texture2d.txt`. The bundles are then downloaded into the folder: `./resources/[server]/[platform]/bundles`.

```powershell
npm run extractImages --% -- --skipDownloads
```

#### --regex

Regex on image name to filter which image to save.

Default: no regex filter

If you are running the command in PowerShell (and maybe others), you will need to prepend the stop-parsing token (`--%`) to the arguments list and add quotes around the regex in order for regex to be passed successfully into the script. Otherwise, characters like '^' will be stripped out.

You can test your regex on the entire list of image names found at `./resources/Global/StandaloneWindows64/filenames_all_texture2d.txt`. The image names for Global/StandaloneWindows64 and Japan/StandaloneWindows64 will be updated in the repository consistently (hopefully).

Sample regex:
- `^equipment_tool.*` - Large, medium, and small icons for equipments.
- `^STL_P_.*_mini` - Chibi images from the Ryza's Challenge event.
- TODO: please help contribute

```powershell
npm run extractImages --% -- --regex "(^STL_P_.*)|(^equipment_.*)|(^battle_tool.*)"
```

### Extract AudioClip

TODO

### Extract VideoClip

TODO

## Preview

TODO idk

## Cloudinary

Settings -> Account -> Product environment cloud name -> change this to whatever.

If you are uploading images through their web interface, then consider disabling the following setting:  
Settings -> Upload -> Upload presets -> ml_default -> Edit -> Unique filename -> off

## Contributing

Either open an issue or make a pull request.