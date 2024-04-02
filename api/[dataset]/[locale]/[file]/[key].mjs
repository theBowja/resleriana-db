import { getDataByKey } from '../../../../main.mjs';

export default function handler(request, response) {
    const { dataset, locale, file, key, value } = request.query;
    return response.json(getDataByKey(dataset, locale, file, key, value));
}