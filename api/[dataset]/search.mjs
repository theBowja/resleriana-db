import { searchData } from '../../main.mjs';

function parseBoolean(str) {
    str = str.toLowerCase();
    if (str === 'true') return true;
    else if (str === 'false') return false;
    else return undefined;
}

function parseQuery(query) {
    const result = {
        locales: [],
        files: [],
        keys: [],
        query: [],
        options: {}
    };

    for (const [key, value] of Object.entries(query)) {
        switch (key.toLowerCase()) {
            case 'language':
            case 'languages':
            case 'server':
            case 'servers':
            case 'locale':
            case 'locales':
                result.locales.push(...value.split(','));
                break;
            case 'file':
            case 'files':
                result.files.push(...value.split(','));
                break;
            case 'key':
            case 'keys':
                result.keys.push(...value.split(','));
                break;
            case 'query':
            case 'queries':
                result.query.push(...value.split(','));
                break;
            case 'firstresult':
            case 'firstresultonly':
            case 'topresult':
            case 'topresultonly':
                if (parseBoolean(value) !== undefined) result.options.firstResultOnly = parseBoolean(value);
                break;
            case 'numberresult':
            case 'numberresults':
            case 'numberofresult':
            case 'numberofresults':
                result.options.numberOfResults = parseInt(value);
                break;
            case 'multikeylogic':
                result.options.multiKeyLogic = value;
                break;
            case 'resultlang':
            case 'resultlanguage':
            case 'returnlang':
            case 'returnlanguage':
            case 'resultlocale':
            case 'returnlocale':
                result.options.resultLocale = value;
                break;
            case 'activeonly':
            case 'activetimeonly':
                result.options.activeOnly = parseBoolean(value);
                break;
        }
    }

    return result;
}

export default function handler(request, response) {
    const { locales, files, keys, query, options } = parseQuery(request.query);

    return response.json(searchData(request.query.dataset, locales, files, keys, query, options));
}