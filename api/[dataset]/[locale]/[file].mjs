import { getFile } from '../../../main.mjs';

export default function handler(request, response) {
    const { dataset, locale, file } = request.query;
    return response.json(getFile(dataset, locale, file));
}