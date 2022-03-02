function parseJson<T>(json: string): T | undefined {
    try {
        return JSON.parse(json) as T;
    } catch {
        return undefined;
    }
}


function isObject(object: any): boolean {
    return object != null && object.constructor.name === "Object"
}


export default {
    parseJson,
    isObject
}