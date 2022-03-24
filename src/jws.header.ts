import { ErrorCode } from "./error.js";
import utils from "./utils.js";
import Context from "./context.js";
import { Base64Url } from "./types.js";
import convert from "./convert.js";
import key from "./key.js";


const label = 'JWS.header';

const REQUIRED_HEADER_VALUES = {
    zip: 'DEF',
    alg: 'ES256',
}


function decode(context: Context): Context {

    const { log } = context;
    log.label = label;
    const header = context.flat.header;

    //
    // header param must be base64url encoded
    //    
    if (!utils.is.base64url(header)) {
        log.fatal(`header parameter is not base64url`, ErrorCode.PARAMETER_INVALID);
        return context;
    };

    //
    // decode to json text
    //  
    const json = convert.base64ToText(header);
    log.debug(`header json:\n ${json}`);

    //
    // header text must be parse-able as JSON
    //   
    try {
        context.jws.header = JSON.parse(json);
    } catch {
        log.fatal(`header cannot be parsed as JSON`, ErrorCode.JWS_HEADER_DECODE_FAIL);
        context.jws.header = undefined;
    }

    return context;
}


function validate(context: Context): Context {

    const { log } = context;
    log.label = label;

    const header = context.jws.header;

    //
    // Header must be an Object (not Array or Null either)
    //  
    if (!utils.is.object(header)) {
        return log.fatal("JWS header is not an Object.", ErrorCode.JWS_HEADER_ERROR);
        //return context;
    }

    //
    // Must have an 'alg' property equal to 'ES256'
    //
    if (!('alg' in header)) {
        log.error("JWS header missing 'alg' property.", ErrorCode.JWS_HEADER_ERROR);
    } else if (header.alg !== REQUIRED_HEADER_VALUES.alg) {
        log.error(`Wrong value for JWS header property 'alg'; expected: 'ES256', actual: '${header.alg}'.`, ErrorCode.JWS_HEADER_ERROR);
    }

    //
    // Must have an 'zip' property equal to 'DEF'
    //
    if (!('zip' in header)) {
        log.error("JWS header missing 'zip' property.", ErrorCode.JWS_HEADER_ERROR);
    } else if (header.zip !== REQUIRED_HEADER_VALUES.zip) {
        log.error(`Wrong value for JWS header property 'zip'; expected: 'DEF', actual: '${header.zip}'.`, ErrorCode.JWS_HEADER_ERROR);
    }

    //
    // Must have an 'kid' property as base64url string
    //
    if (!('kid' in header)) {
        log.error("JWS header missing 'kid' property.", ErrorCode.JWS_HEADER_ERROR);
    } else if (!utils.is.base64url(header.kid)) {
        log.error("JWS header 'kid' property not encoded as base64url.", ErrorCode.JWS_HEADER_ERROR);
    }

    // TODO: check kid if options.privateKey available

    //
    // Must not have extra properties
    //
    const expectedKeys = ['alg', 'zip', 'kid'];
    Object.keys(header)
        .filter(key => !expectedKeys.includes(key))
        .forEach(key => log.warn(`Unexpected property '${key}' in JWS header.`));


    return context;

}


function encode(context: Context): Context {

    context.log.label = label;

    if (validate(context).log.isFatal) return context;

    context.flat.header = convert.textToBase64(JSON.stringify(context.jws.header), true) as Base64Url;

    return context;
}


async function generate(context: Context): Promise<Context> {

    const { log } = context;
    log.label = 'JWS.Header';
    const { privateKey } = context.options;

    if (!privateKey || !key.validate.key(privateKey, true, context)) {
        return log.fatal(`options.privateKey is required for header.kid generation and must be a JWK private key`, ErrorCode.JWS_HEADER_GENERATE_FAIL);
    }

    // generate a header is we don't have one
    if (!context.jws.header) {
        context.jws.header = {
            zip: REQUIRED_HEADER_VALUES.zip,
            alg: REQUIRED_HEADER_VALUES.alg,
            kid: await key.computeKid(privateKey)
        }
        // clear the upstream encodings so there is no confusion over what header is encoded
        context.flat.header = context.compact = context.qr = undefined;
    }

    return context;
}

export default { encode, decode, validate, generate };