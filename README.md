# resleriana-db

This repository provides easy access to all the resources required for creating your own project for Atelier Resleriana.

Provided from repository, web API, and npm package:
- masterdata data (contains game data)
- parsed data (contains curated data from masterdata) (UNMAINTAINED)
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
- `/data` - Contains the masterdata, parsed.
- `/dist` - TODO for npm publishing.
- `/docs` - Extra documentation.
- `/import` - Contains the helper scripts used to download catalog, extract resource metadata, extract and parse masterdata, and deserialize TextAssets.
- `/resources` - TextAsset JSON organized by locales
- `/tools` - Contains the non-Javascript scripts used for downloading bundles and extracting Unity assets.
- `/types` - TODO
- `main.mjs` - Script contains the data retrieval and data searching functions.

### master

This dataset contains the original data directly used in the game.

### parsed

UNMAINTAINED

This dataset contains files and data properties curated from the master data.

## Get data

JSON data is divided into datasets and locale.  

Datasets: master, parsed  
Locales: en, jp, zh-cn, zh-tw  

Note: master data contains some properties that end in `_still_path_hash`. These can be mapped to actual image names using the JSON map at [/resources/Global/path_hash_to_name.json](./resources/Global/path_hash_to_name.json) or [/resources/Japan/path_hash_to_name.json](./resources/Japan/path_hash_to_name.json).

### From repository

JSON data is stored in the `/data/[dataset]/[locale]` folder and can be 

Alternatively, you can import the following functions from the main.mjs file:
- getFile(dataset, locale, file)
- getDataByKey(dataset, locale, file, key, value)
- searchData(dataset, locale, files, keys, query, options={})

Documentation for these functions can be found in the [next section](#from-npm-package).

### From npm package

UNIMPLEMENTED

JSON data for master and parsed can be downloaded as an npm package for your JavaScript project. The size of the JSONs combined is 70MB+ or 5MB+ compressed. Please refrain from loading the entire package directly into your HTML because that will directly ruin your loading times.

```
PACKAGE ISN'T PUBLISHED AND DOESN'T EXIST YET
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

The web API is hosted on Vercel serverless functions and can be used to search and retrieval data in the /data folder.

See [docs/api.md](./docs/api.md)

## Extract resources

This repository provides npm run-scripts for extracting the following UnityAssets: Texture2D, Sprite, AudioClip, VideoClip.

| Run-script | Description | Documentation|
|---|---|---|
| `extractImages` | Extracts images | [/docs/images.md](./docs/images.md) |
| `extractText` | Extracts story dialogue and system text | [/docs/text.md](./docs/text.md) |
| `extractBGM` | Extracts background music | [/docs/audio.md](./docs/audio.md) |
| `extractVoice` | Extracts voice lines from the main story quest | [/docs/audio.md](./docs/audio.md) |
| `extractVideo` | TODO | TODO |

## Preview

TODO idk

## Cloudinary

Settings -> Account -> Product environment cloud name -> change this to whatever.

If you are uploading images through their web interface, then consider disabling the following setting:  
Settings -> Upload -> Upload presets -> ml_default -> Edit -> Unique filename -> off

## Contributing

Either open an issue or make a pull request.  

Helpers are wanted for making sure the versions are updated in a timely manner. Currently it is a manual process to find the versions and update [/import/config.json](./import/config.json) in order to trigger the automated extraction.

### masterdata version

1. Open Fiddler Classic and begin capturing traffic
2. Open Steam version of Atelier Resleriana
3. "Tap to start"
4. An HTTPS call to asset.resleriana.com should show up in your Fiddler logs
    - If this does not show up, then you will need to go back to the title screen and switch to a different language
5. Copy the entire URL and extract only the version part
6. Turn off Fiddler capturing traffic

### fileassets version

1. Open Steam version of Atelier Resleriana
2. Update the game
3. Right-click on the game in your Steam library  
    - Manage -> Browse local files
4. Go into the folder `AtelierResleriana_Data\ABCache\content_catalogs`
5. Copy the name of the catalog file and remove the `_catalog.json` at the end

