export function withAuthorizationHeader(headers, token) {
    if (!headers) {
        headers = {};
    }

    headers['Authorization'] = "Bearer " + token;

    return headers
}

export function withJSONContent(headers) {
    if (!headers) {
        headers = {};
    }

    headers['Content-type'] = 'application/json';

    return headers
}