import Context from "./context.js";
import convert from "./convert.js";
import { hash } from './crypto.js';
import { ErrorCode } from "./error.js";
import { JWK, Base64Url } from "./types.js";
import { is } from "./utils.js";

const REQUIRED_KEY_VALUES = {
    kty: 'EC',
    use: 'sig',
    alg: 'ES256',
    crv: 'P-256',
}

const LABEL = 'KEY';


async function validateKeys(keys: any, context: Context): Promise<boolean> {

    const log = context.log(LABEL);
    const errorCount = log.entries().length;

    if (!(keys instanceof Array)) {
        log.fatal(`keys param is not an Array`);
        return Promise.resolve(false);
    }

    if(context.options.validation?.key?.filterBadKeys === true) {
        keys = keys.filter( k => k.alg === REQUIRED_KEY_VALUES.alg);
    }

    for (const key of keys) {
        await validateKey(key, false, context);
    }

    return errorCount === log.entries().length;

};


async function validateKey(key: JWK, isPrivate = false, context: Context): Promise<boolean> {

    const log = context.log();
    const errorCount = (context.errors?.length ?? 0);

    if (!is.object(key)) {
        log.fatal(`key param is not an object`, ErrorCode.PARAMETER_INVALID);
        return false;
    }

    if (!('kty' in key) || typeof key.kty !== 'string' || key.kty !== REQUIRED_KEY_VALUES.kty) {
        log.error(`key.kty is not equal to '${REQUIRED_KEY_VALUES.kty}'`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if (!('kid' in key) || !is.base64url(key.kid)) {
        log.error(`key.kid is not base64url string`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if (!('use' in key) || typeof key.use !== 'string' || key.use !== REQUIRED_KEY_VALUES.use) {
        log.error(`key.use is not equal to '${REQUIRED_KEY_VALUES.use}'`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if (!('alg' in key) || typeof key.alg !== 'string' || key.alg !== REQUIRED_KEY_VALUES.alg) {
        log.error(`key.alg is not equal to '${REQUIRED_KEY_VALUES.alg}'`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if (!('crv' in key) || typeof key.crv !== 'string' || key.crv !== REQUIRED_KEY_VALUES.crv) {
        log.error(`key.crv is not equal to '${REQUIRED_KEY_VALUES.crv}'`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if (!('x' in key) || !is.base64url(key.x)) {
        log.error(`key.x is not base64url string`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if (!('y' in key) || !is.base64url(key.y)) {
        log.error(`key.y is not base64url string`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if (isPrivate) {
        if (!('d' in key) || !is.base64url(key.y)) {
            log.error(`key.d is not base64url string`, ErrorCode.JWK_INVALID_PROPERTY);
        }
    }

    if (!isPrivate && ('d' in key)) {
        log.error(`key.d should not be in public key`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if ('crlVersion' in key && typeof key.crlVersion !== 'number') {
        log.error(`optional key.crlVersion is not a number`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    if ('x5c' in key && !is.stringArray(key.x5c)) {
        log.warn(`optional key.x5c is not a string[]`, ErrorCode.JWK_INVALID_PROPERTY);
    }

    // don't check kid if we have key errors since the computed value will likely be wrong
    if (errorCount === (context.errors?.length ?? 0) && context.options?.validation?.key?.computeKid !== false) {
        const computedKid = await computeKid(key as JWK);
        if (computedKid !== key.kid) {
            log.error(`key.kid has incorrect value ${key.kid}. Expected: ${computedKid}`, ErrorCode.JWK_INCORRECT_KID);
        }
    }

    //
    // Check for extra properties
    //
    if (context.options?.validation?.key?.allowAdditionalProperties !== true) {
        const expectedProps = `kty kid use alg crv x y ${isPrivate ? 'd ' : ''}crlVersion x5c`.split(' ');
        Object.keys(key)
            .filter(prop => !expectedProps.includes(prop))
            .forEach(prop => log.warn(`Unexpected property '${prop}' in JWK key.`, ErrorCode.JWK_UNEXPECTED_PROPERTY));
    }

    return errorCount === (context.errors?.length ?? 0);

}



async function computeKid(key: JWK): Promise<Base64Url> {

    // Kid computation requires properties in alphabetical order
    const pKey = { "crv": "P-256", "kty": "EC", "x": key.x, "y": key.y, } as Partial<JWK>;

    const keyBytes = convert.textToBytes(JSON.stringify(pKey));

    const hashResult = await hash(keyBytes).catch(err => {
        throw err;
    });

    return hashResult;
}

const validate = {
    key: validateKey,
    keys: validateKeys
}

export default { validate, computeKid };