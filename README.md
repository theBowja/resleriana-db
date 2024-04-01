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
pip install UnityPy=1.10.7
```

## Repository structure
- `/api` - Contains the code for Vercel API.
- `/auto` - Contains code used by Github Actions to auto-update data and auto-upload assets to Cloudinary CDN.
- `/data` - Contains the masterdata, parsed, and TextAsset JSON organized by language or server.
- `/dist` - TODO
- `/import` - Contains the scripts needed to parse out data from masterdata into a slightly more human-readable data format.
- `/resources` - 
- `/types` - TODO
- `main.mjs` - Script contains the data retrieval and data searching functions.

### master

This dataset contains the original data directly used in the game.

### parsed

This dataset contains files and data properties curated from the master data.

## Get data



### From repository

JSON data is stored in the `/data` folder and divided into datasets, languages, and servers.  

Formats: master, parsed.  
Languages: en, jp, zh-cn, zh-tw.  

Formats: TextAsset.  
Servers: Global, Japan.   

### From npm package

TODO

### From web API

The web API is hosted on Vercel serverless functions. If access to Vercel servers is not supported in your region, then it is very easy to set up your own API because the routes in `/api` folder map directly to functions exported in the `main.mjs` script. The APIs are split into two different types: [retrieval](#data-retrieval-api) and [searching](#data-searching-api).

### Data retrieval API

#### GET: /api/{dataset}/{language}/{file}
Retrieves the JSON file for the given dataset, language, and filename. Returns *undefined* if there is no result.

Examples:  
https://resleriana-db.vercel.app/api/master/en/base_character

#### GET: /api/{dataset}/{language}/{file}/{key}
Retrieves the *first* data object that contains the same key and value. Returns *undefined* if there is no result.

Required query parameters:  
**value** *{string}* - Description.

Examples:  
https://resleriana-db.vercel.app/api/master/en/character/id?value=43101

### Data searching API

Searching functionality uses fuzzy search from the [uFuzzy](https://github.com/leeoniya/uFuzzy) library which provides functionality like auto-complete.

#### GET: /api/{dataset}/search
Searches through multiple languages, files, and keys to find the best match for the search query. If **topResultOnly** is *true*, then returns the ??? object or *undefined* for no result. If **topResultOnly** is *false*, then returns ??? array of ??? objects or empty array for no result.

Required query parameters:  
**language** *{string}* - Comma-separated list of languages to search in.  
**file** *{string}* - Comma-separated list of files to search in. Do not include `.json`.  
**key** *{string}* - Comma-separated list of keys to search in.  
**query** *{string}* - The search query.  

Optional query parameters:
**firstResultOnly** *{boolean?}* - Default true.  
**numberOfResults** *{number?}* - Default -1. If topResultOnly is set to false, then this API will return an 
**multiKeyLogic** *{string?}* - Default "AND".
**resultLanguage** *{string?}* - Default undefined.
**activeOnly** *{boolean?}* - Default true. Whether or not to include data where the current time is not between the `start_at` or `end_at` properties.

Examples:  
https://resleriana-db.vercel.app/api/master/search?language=en&file=character&key=name&query=resna  
https://resleriana-db.vercel.app/api/parsed/search?language=en&file=material&key=equipment_trait.name,equipment_trait.name&query=physical%20res,%20magic%20res  

## Extract resources

Description.

### Extract Texture2D

Prerequisite: [set up local environment](#local-development).  
You can use the `extractImages` run-script to extract all images with the default options. TODO describe what it does. it downloads

```
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

```
npm run extractImages --% -- --server "Japan"
```

#### --platform

Which platform to download Unity bundles for.

Options: "StandaloneWindows64", "Android", and "iOS"  
Default: "StandaloneWindows64"

The images from "StandaloneWindows64" will be of noticeable higher quality than images from the mobile platforms.

```
npm run extractImages --% -- --platform "Android"
```

#### --imagesOutputFolder

Path to the folder where the images will be outputted.

Default: "./resources/[server]/[platform]/Texture2D"

 If it is a relative path, then it will be relative to the current working directory.

```
npm run extractImages --% -- --imagesOutputFolder "./path/to/wherever"
```

#### --imageFormat

Format of the image to convert to.

Options: "png" and "webp"  
Default: "webp"

Assets inside Unity bundles are in a compressed format like BC7. They are decompressed into RGBA before being converted into a more common format. This conversion step can be time-consuming, especially for large batches of images. Processing over 2,000 images might take more than a minute.

Currently, png images are double the size of webp images. Webp images will go through lossy conversion. You can change the quality of the conversion by modifying the python script at `./tools/UnityPyScripts/exportAssets.py`.

```
npm run extractImages --% -- --imageFormat "png"
```

#### --skipDownloads

Whether or not to skip downloading the catalog and bundles.

Default: false

This may be useful for saving time if you've already downloaded the catalog and bundles from running the command previously and know that the game has not been updated since. The script downloads the catalog in order to create a list of Unity bundles that contain Texture2D assets. This is list is saved in the file: `./resources/[server]/[platform]/bundlenames_all_texture2d.txt`. The bundles are then downloaded into the folder: `./resources/[server]/[platform]/bundles`.

```
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

```
npm run extractImages --% -- --regex "(^STL_P_.*)|(^equipment_.*)|(^battle_tool.*)"
```

### Extract AudioClip

TODO

### Extract VideoClip

TODO

## Cloudinary

Settings -> Account -> Product environment cloud name -> change this to whatever.

If you are uploading images through their web interface, then consider disabling the following setting:  
Settings -> Upload -> Upload presets -> ml_default -> Edit -> Unique filename -> off

## Contributing

Either open an issue or make a pull request.