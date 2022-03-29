// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.



import { JWSPayload } from "./types.js";
import { inflateSync } from "fflate";
import Context from "./context.js";
import { ErrorCode } from "./error.js";
import utils from "./utils.js";
import convert from "./convert.js";
import * as fflfate from "fflate";


const label = 'JWS.payload';


function validate(context: Context): Context {

    const { log } = context;
    log.label = label;

    const payload = context.jws.payload;

    //
    // payload must be an Object
    //  
    if (!utils.is.object(payload)) {
        log.fatal("JWS payload is not an Object.", ErrorCode.JWS_PAYLOAD_ERROR);
        return context;
    }

    if (!('iss' in payload)) {
        log.fatal(`JWS Payload missing 'issuer' ('iss') property.`, ErrorCode.JWS_PAYLOAD_ERROR);
        return context;
    }

    if (!('nbf' in payload)) {
        log.fatal(`JWS Payload missing 'not before' ('nbf') property.`, ErrorCode.JWS_PAYLOAD_ERROR);
        return context;
    }

    if (!('vc' in payload)) {
        log.fatal(`JWS Payload missing 'verifiable credential' ('vc') property.`, ErrorCode.JWS_PAYLOAD_ERROR);
        return context;
    }

    if ('exp' in payload) {
        log.fatal(`JWS Payload missing 'expiration' ('exp') property.`, ErrorCode.JWS_PAYLOAD_ERROR);
        return context;
    }

    return context;
}


function decode(context: Context): Context {

    const { log } = context;
    log.label = label;
    const payload = context.flat.payload;

    //
    // payload param must be base64url 
    //    
    if (!utils.is.base64url(payload)) {
        log.fatal(`payload parameter is not base64url`, ErrorCode.PARAMETER_INVALID);
        return context;
    };
    log.debug(`payload base64url:\n ${payload}`);

    //
    // decode to bytes
    //  
    const uint8Array: Uint8Array = convert.base64ToBytes(payload.trim());
    log.debug(`payload Uint8Array:\n ${uint8Array}`);

    //
    // 'inflate' the bytes to bytes
    //  
    let inflatedUint8;
    try {
        inflatedUint8 = inflateSync(uint8Array);
    } catch (error) {
        log.fatal(`failed to inflate payload ${(error as Error).toString()}`, ErrorCode.JWS_PAYLOAD_DECODE_ERROR);
        return context;
    }

    //
    // decode to json text
    //  
    const json = convert.bytesToText(inflatedUint8);

    //
    // convert json to payload object
    //
    const jwsPayload = utils.parseJson<JWSPayload>(json);

    if (!jwsPayload) {
        log.fatal('JWS Payload could not be decoded as JSON.', ErrorCode.JWS_PAYLOAD_DECODE_ERROR);
        return context;
    }

    context.jws.payload = jwsPayload;
    context.fhirbundle = context.jws.payload?.vc?.credentialSubject?.fhirBundle;

    return context;
}


function encode(context: Context): Context {

    const { log } = context;
    log.label = label;

    if (validate(context).log.isFatal) return context;

    const json = JSON.stringify(context.jws.payload);

    const bytes = convert.textToBytes(json);

    const deflated = fflfate.deflateSync(new Uint8Array(bytes), { level: context.options?.encode?.deflateLevel || 6 });

    context.flat.payload = convert.bytesToBase64(deflated, true);

    return context;
}


export default { encode, decode, validate };
