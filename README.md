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
  - [Data format](#data-format)
- [Accessing game data](#accessing-game-data)
  - [from repository](#from-repository)
  - [from npm package](#from-npm-package)
  - [from web API](#from-web-api)
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
- `/api` - Contains the API.
- `/data` - TODO
- `/dist` - TODO
- `/import` - Contains the scripts needed to parse out data from masterdata into a slightly more human-readable data format.
- `/types` - TODO
- `main.mjs` - Contains the main data retrieval and searching functions.

### Data format

Data is stored in the `/data` folder and divided into two formats, four languages, and multiple files.  
Formats: master, parsed.  
Languages: en, jp, zh-cn, zh-tw.


### master

This dataset contains the original data directly used in the game.

### parsed

This dataset contains files and data properties curated from the master data.

## Accessing game data

uhh

### From repository

### From npm package

### From web API

The web API is hosted on Vercel serverless functions. If access to Vercel servers is not supported in your region, then it is very easy to set up your own API because the routes in `/api` folder map directly to functions exported in the `main.mjs` script. The APIs are split into two different types: retrieval and searching.

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


## Cloudinary

Settings -> Account -> Product environment cloud name -> change this to whatever.

If you are uploading images through their web interface, then consider disabling the following setting:  
Settings -> Upload -> Upload presets -> ml_default -> Edit -> Unique filename -> off

## Contributing

Either open an issue or make a pull request.