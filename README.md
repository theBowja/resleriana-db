# resleriana-db

This repository stores Atelier Resleriana data in four languages and hosts an API for it on Vercel.

## Table of Contents

- [Respository structure](#repository-structure)
- [Data format](#data-format)
- [Web API](#web-api)
- [Contributing](#contributing)

## Repository structure
- `/api` - Contains the API.
- `/data` - TODO
- `/dist` - TODO
- `/import` - Contains the scripts needed to parse out data from masterdata into a slightly more human-readable data format.
- `/types` - TODO
- `main.mjs` - Contains the main data retrieval and searching functions.

## Data format

Data is stored in the `/data` folder and divided into two formats, four languages, and multiple files.  
Formats: master, parsed.  
Languages: en, jp, zh-cn, zh-tw.

### master

This dataset contains the original data directly used in the game.

### parsed

This dataset contains files and data properties curated from the master data.

## Web API

The web API is hosted on Vercel serverless functions. If access to Vercel servers is not supported in your region, then it is very easy to set up your own API because the routes in `/api` folder map directly to functions exported in the `main.mjs` script.

### Data retrieval

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

### Search API

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

## Development

Install Node v20+

Use `npm install` to install all the JavaScript dependencies.

Tools in the `/tools` folder require different frameworks and packages to be installed.

`AtelierToolBundleDownload` requires net7.0 to be installed.

`UnityPyScripts` require python 3.7+ and UnityPy 1.10.7+.
- `pip install UnityPy=1.10.7`

## Contributing

Either open an issue or make a pull request.