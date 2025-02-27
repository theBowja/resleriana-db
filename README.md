# resleriana-db

This repository provides easy access to all the resources required for creating your own project for Atelier Resleriana.

Provided from repository and web API:
- masterdata data (contains game data)

Provided from repository:
- TextAsset data (contains story dialogue, SystemText, etc.)
- built-in scripts to extract your own images, BGM, voiceclips, and videos
- mapping for converting `_still_path_hash` in masterdata to extracted image names

## Table of Contents
- [Local development](#local-development)
- [Respository structure](#repository-structure)
- [Get masterdata](#get-masterdata)
  - [from repository](#from-repository)
  - [from web API](#from-web-api)
- [Extract resources](#extract-resources)
- [Contributing](#contributing)

## Local Development

Everything you'll need to run the built-in scripts locally.

Clone the repository:
```
git clone https://github.com/theBowja/resleriana-db.git
```

Install Node.js v20 (doesn't work with v22+):  
https://nodejs.org/en/download  
Use fnm in order to be able to install and use different versions of Node at the same time.

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

Install Python 3.8 - 3.12 (required for UnityPy asset extraction):  
https://www.python.org/downloads/   
Use [pyenv](https://github.com/pyenv/pyenv) or [pyenv-win](https://github.com/pyenv-win/pyenv-win) to use multiple versions of Python  
If you are using pyenv-win, you might need to disable the built-in Python launcher via Start > "Manage App Execution Aliases" and turning off the "App Installer" aliases for Python

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
- `/auto` - Contains code used by Github Actions to auto-update data.
- `/data` - Contains the masterdata.
- `/docs` - Extra documentation.
- `/import` - Contains the helper scripts used to download catalog, extract resource metadata, extract masterdata, and deserialize TextAssets.
- `/resources` - TextAsset JSON organized by locales
- `/tools` - Contains the non-Javascript scripts used for downloading bundles and extracting Unity assets.
- `main.mjs` - Script contains the data retrieval and data searching functions.

## Get masterdata

JSON data for masterdata is divided by locale.  

Locales: en, jp, zh-cn, zh-tw  

Note: master data contains some properties that end in `_still_path_hash`. These can be mapped to actual image names using the JSON map at [/resources/Global/path_hash_to_name.json](./resources/Global/path_hash_to_name.json) or [/resources/Japan/path_hash_to_name.json](./resources/Japan/path_hash_to_name.json).

### From repository

JSON data for masterdata is stored in the `/data/master/[locale]` folder and can be accessed directly by using the `main.mjs` script.

From the `main.mjs` file, you can import the following functions:
- getFile(dataset, locale, file)
- getDataByKey(dataset, locale, file, key, value)
- searchData(dataset, locale, files, keys, query, options={})

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

## Other scripts

Other scripts are also provided for supporting functionality.

| Run-script | Description | Documentation|
|---|---|---|
| `updatePathHashMap` | Generates mapping between masterdata's still path hashes to their respective image names | [/docs/stillpathhash.md](./docs/stillpathhash.md) |

## Contributing

Either open an issue or make a pull request.  

Helpers are wanted for making sure the versions are updated in a timely manner. Currently it is a manual process to find the versions and update [/import/config.json](./import/config.json) in order to trigger the automated extraction.

### masterdata version

1. Open Steam version of Atelier Resleriana
2. "Tap to start"
3. Use Windows search `%AppData%` to open up the AppData folder
4. For Global, navigate to `AppData/LocalLow/KOEI TECMO GAMES CO_, LTD_/Atelier Resleriana_ Forgotten Alchemy and the Polar Night Liberator/Library`
5. For Japan, navigate to `AppData/LocalLow/KOEI TECMO GAMES CO_, LTD_/レスレリアーナのアトリエ ～忘れられた錬金術と極夜の解放者～/Library`
6. Find the URL that starts with `https://asset.resleriana.com/master_data/en/` or `https://asset.resleriana.jp/master_data/` and extract only the version part

~~1. Open Fiddler Classic and begin capturing traffic~~  
~~2. Open Steam version of Atelier Resleriana~~  
~~3. "Tap to start"~~  
~~4. An HTTPS call to asset.resleriana.com should show up in your Fiddler logs~~  
    ~~- If this does not show up, then you will need to go back to the title screen and switch to a different language~~  
~~5. Copy the entire URL and extract only the version part~~  
~~6. Turn off Fiddler capturing traffic~~

### fileassets version

1. Open Steam version of Atelier Resleriana
2. Update the game
3. Right-click on the game in your Steam library  
    - Manage -> Browse local files
4. Go into the folder `AtelierResleriana_Data\ABCache\content_catalogs`
5. Copy the name of the catalog file and remove the `_catalog.json` at the end

