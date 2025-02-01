# API

The web API is hosted on Vercel serverless functions. Access to Vercel servers may not be supported in non-US regions, but it is very easy to set up your own API. The routes in `/api` folder map directly to functions exported in the `main.mjs` script.

The APIs are split into two different types: [retrieval](#data-retrieval-api) and [searching](#data-searching-api).

## Data retrieval API

### GET: /api/{dataset}/{locale}/{file}
Returns the JSON data file for the given dataset, locale, and filename. Returns *undefined* if there is no result.

Examples:  
- https://resleriana-db.vercel.app/api/master/en/base_character

### GET: /api/{dataset}/{locale}/{file}/{key}
Returns the *first* subdata object that matches the same key and value. Returns *undefined* if there is no result.

Required query parameters:  
- **value** *{string}* - Value to match.

Examples:  
- https://resleriana-db.vercel.app/api/master/en/character/id?value=43101

## Data searching API

Searching functionality uses fuzzy search from the [uFuzzy](https://github.com/leeoniya/uFuzzy) library which provides auto-complete functionality.

### GET: /api/{dataset}/search
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
<!-- - https://resleriana-db.vercel.app/api/parsed/search?locale=en&file=material&key=equipment_trait.name,equipment_trait.name&query=physical%20res,%20magic%20res   -->