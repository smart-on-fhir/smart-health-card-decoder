import { ErrorCode } from "./error";
import { Artifact } from "./log";
import b64 from "./base64";
import ValidationContext from "./context";
import { JWS, JWSHeader } from "./types";
import utils from "./utils";

const base64urlPatternWS = /^\s*[\w-]+\s*$/;
const base64urlPattern = /[\w-]+/;

function decode(header: string, context: ValidationContext): ValidationContext {

    const log = context.log;
    log.artifact = Artifact.JWS;

    //
    // header param must be a string
    //    
    if (typeof header !== 'string') {
        log.fatal(`header parameter not a string`, ErrorCode.JWS_HEADER_DECODE_FAIL);
        return context;
    }

    //
    // header param must be base64url encoded
    //    
    if (!base64urlPatternWS.test(header)) {
        log.fatal(`header parameter not base64url format`, ErrorCode.JWS_HEADER_DECODE_FAIL);
        return context;
    };

    //
    // extract only the base64url ignoring whitespace
    //   
    const base64url = header.match(base64urlPattern)?.[0] ?? '';
    log.debug(`header base64url:\n ${base64url}`);

    //
    // extract only the base64url ignoring whitespace
    //  
    const text = b64.toUtf8(base64url);
    log.debug(`header json:\n ${text}`);

    //
    // create an empty JWS if one does not already exist
    // 
    context.jws = context.jws || {} as JWS;

    //
    // header base64url must be parseable as JSON
    //   
    try {
        context.jws.header = JSON.parse(text);
    } catch {
        log.fatal(`header cannot be parsed as JSON`, ErrorCode.JWS_HEADER_DECODE_FAIL);
    }

    return context;
}


//function validate(header: JWSHeader, context: ValidationContext): ValidationContext {
function validate(context: ValidationContext): ValidationContext {

    const { log } = context;
    log.artifact = Artifact.JWS;

    if(!context?.jws?.header) {
        log.fatal('context.jws.header not found. Cannot do validations.');
        return context;
    }

    const header = context?.jws?.header ?? {};

    //
    // Header must be an Object (not Array or Null either)
    //  
    if (!utils.isObject(header)) {
        log.fatal("JWS header is not an Object.", ErrorCode.JWS_HEADER_ERROR);
        return context;
    }

    //
    // Must have an 'alg' property equal to 'ES256'
    //
    if (!('alg' in header)) {
        log.error("JWS header missing 'alg' property.", ErrorCode.JWS_HEADER_ERROR);
    } else if (header.alg !== 'ES256') {
        log.error(`Wrong value for JWS header property 'alg'; expected: 'ES256', actual: '${header.alg}'.`, ErrorCode.JWS_HEADER_ERROR);
    }

    //
    // Must have an 'zip' property equal to 'DEF'
    //
    if (!('zip' in header)) {
        log.error("JWS header missing 'zip' property.", ErrorCode.JWS_HEADER_ERROR);
    } else if (header.zip !== 'DEF') {
        log.error(`Wrong value for JWS header property 'zip'; expected: 'DEF', actual: '${header.zip}'.`, ErrorCode.JWS_HEADER_ERROR);
    }

    //
    // Must have an 'kid' property as base64url string
    //
    if (!('kid' in header)) {
        log.error("JWS header missing 'kid' property.", ErrorCode.JWS_HEADER_ERROR);
    } else if (!b64.isBase64url(header.kid)) {
        log.error("JWS header 'kid' property not encoded as base64url.", ErrorCode.JWS_HEADER_ERROR);
    }

    //
    // Warn if additional properties are found
    //
    const expectedKeys = ['alg', 'zip', 'kid'];
    Object.keys(header)
        .filter(key => !expectedKeys.includes(key))
        .forEach(key => log.warn(`Unexpected property '${key}' in JWS header.`));


    return context;

}

export default { decode, validate };