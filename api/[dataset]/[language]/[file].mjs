import { getFile } from '../../../main.mjs';

export default function handler(request, response) {
    const { dataset, language, file } = request.query;
    return response.json(getFile(dataset, language, file));
}