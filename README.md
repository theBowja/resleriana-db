# resleriana-db

This repository stores Atelier Resleriana data in four languages and hosts an API for it on Vercel.

## Table of Contents

- [Respository structure](#repository-structure)
- [Data](#data)
- [API](#api)
- [Contributing](#contributing)

## Repository structure
- /api - Contains the API.
- /data - TODO
- /dist - TODO
- /import - Contains the scripts needed to parse out data from masterdata into a slightly more human-readable data format.
- /types - TODO
- main.mjs - Contains the main data retrieval and searching functions.

## Data

Data is stored in the `/data` folder and divided into two formats, four languages, and multiple files.  
Formats: master, parsed.  
Languages: en, jp, cn-zh, cn-tw

### master

This dataset contains the original data directly from the game.

### parsed

This dataset contains files and data properties curated from the master data.

## API

The web API is hosted on Vercel serverless functions. If access to Vercel servers are not supported in your region, then it is very easy to set up your own API because the routes in `/api` folder map directly to functions exported in the `main.mjs` script.

### Basic data retrieval

#### GET: /api/{dataset}/{language}/{file}
Retrieves the JSON file for the given dataset, language, and filename.

Examples:  
https://resleriana-db.vercel.app/api/master/en/base_character

#### GET: /api/{dataset}/{language}/{file}/{key}
Retrieves the *first* data object that matches the same key and value.

Query parameters:  
**value** *{string}* - Description.

Examples:  
https://resleriana-db.vercel.app/api/master/en/character/id?value=43101

### Search API

Searching functionality uses the [uFuzzy](https://github.com/leeoniya/uFuzzy) fuzzy search library which provides functionality like auto-complete.

#### GET: /api/{dataset}/search
search multiple folders and languages

Query parameters:  
**languages** *{string}* - Description.  
**files** *{string}* - Description.  
**keys** *{string}* - Description.  
**query** *{string}* - Description.  

**topResultOnly** *{boolean?}* - default true.  
**numberOfResults** *{number?}* - default 3. If topResultOnly is set to false, then this API will return an 

Examples:  
https://resleriana-db.vercel.app/api/master/en/character/id?value=43101

## Contributing

Either open an issue or make a pull request.