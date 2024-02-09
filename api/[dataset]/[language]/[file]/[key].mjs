import { getDataByKey } from '../../../../main.mjs';

export default function handler(request, response) {
    const { dataset, language, file, key, value } = request.query;
    return response.json(getDataByKey(dataset, language, file, key, value));
}