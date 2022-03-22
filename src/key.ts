import Context from "./context";
import convert from "./convert";
import subtle from "./crypto";
import { ErrorCode } from "./error";
import { JWK, Base64Url } from "./types";
import utils from "./utils";

const REQUIRED_KEY_VALUES = {
    kty: 'EC',
    use: 'sig',
    alg: 'ES256',
    crv: 'P-256',
}


async function validateKeys(keys: any, context: Context): Promise<boolean> {

    const { log } = context;
    const errorCount = context.log.entries().length;

    if (!(keys instanceof Array)) {
        log.fatal(`keys param is not an Array`);
        return Promise.resolve(false);
    }

    for (const key of keys) {
        await validateKey(key, false, context);
    }

    return errorCount === context.log.entries().length;

};


async function validateKey(key: any, isPrivate = false, context: Context): Promise<boolean> {

    const { log } = context;
    const errorCount = context.log.entries().length;

    if (!utils.is.object(key)) {
        log.fatal(`key param is not an object`);
        return false;
    }

    if (!('kty' in key) || typeof key.kty !== 'string' || key.kty !== REQUIRED_KEY_VALUES.kty) {
        log.warn(`key.kty is not equal to '${REQUIRED_KEY_VALUES.kty}'`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if (!('kid' in key) || !utils.is.base64url(key.kid)) {
        log.error(`key.kid is not base64url string`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if (!('use' in key) || typeof key.use !== 'string' || key.use !== REQUIRED_KEY_VALUES.use) {
        log.warn(`key.use is not equal to '${REQUIRED_KEY_VALUES.use}'`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if (!('alg' in key) || typeof key.alg !== 'string' || key.alg !== REQUIRED_KEY_VALUES.alg) {
        log.warn(`key.alg is not equal to '${REQUIRED_KEY_VALUES.alg}'`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if (!('crv' in key) || typeof key.crv !== 'string' || key.crv !== REQUIRED_KEY_VALUES.crv) {
        log.warn(`key.crv is not equal to '${REQUIRED_KEY_VALUES.crv}'`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if (!('x' in key) || !utils.is.base64url(key.x)) {
        log.error(`key.x is not base64url string`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if (!('y' in key) || !utils.is.base64url(key.y)) {
        log.error(`key.y is not base64url string`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if (isPrivate) {
        if (!('d' in key) || !utils.is.base64url(key.y)) {
            log.error(`key.d is not base64url string`, ErrorCode.JWK_INVALID_PROPERTY);
        }
    }

    if ('crlVersion' in key && typeof key.crlVersion !== 'number') {
        log.warn(`optional key.crlVersion is not a number`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if ('x5c' in key && !utils.is.stringArray(key.x5c)) {
        log.warn(`optional key.x5c is not a string[]`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    const computedKid = await computeKid(key as JWK);
    if (computedKid !== key.kid) {
        log.error(`key.kid has incorrect value ${key.kid}. Expected: ${computedKid}`, ErrorCode.JWK_INCORRECT_KID);
    }

    //
    // Check for extra properties
    //
    const expectedProps = `kty kid use alg crv x y ${isPrivate ? 'd ' : ''}clrVersion x5c`.split(' ');
    Object.keys(key)
        .filter(prop => !expectedProps.includes(prop))
        .forEach(prop => log.warn(`Unexpected property '${prop}' in JWK key.`, ErrorCode.JWK_UNEXPECTED_PROPERTY));

    return errorCount === context.log.entries().length;

}



async function computeKid(key: JWK): Promise<Base64Url> {

    // Kid computation requires properties in alphabetical order
    const pKey = { "crv": "P-256", "kty": "EC", "x": key.x, "y": key.y, } as Partial<JWK>;

    const keyBytes = convert.textToBytes(JSON.stringify(pKey));

    return subtle.digest({ name: "SHA-256", }, keyBytes)
        .then((arrayBuffer: ArrayBuffer) => {
            const uint8 = new Uint8Array(arrayBuffer);
            const hash = convert.bytesToBase64(uint8, true);
            return hash;
        })
        .catch((error: Error) => {
            throw error;
        });

}

const validate = {
    key : validateKey,
    keys: validateKeys
}

export default {validate, computeKid};