// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Context from "./context.js";
import { ErrorCode } from "./error.js";
import fhir from "./fhir.js";
import { IssuerInfo, Issuer, JWSPayload, JWK, JWSHeader } from "./types.js";
import utils from "./utils.js";
import directory from "./directory.js";
import convert from "./convert.js";
import subtle from "./crypto.js";
import download from "./download.js";
import jws_header from "./jws.header.js";
import jws_payload from "./jws.payload.js";
import jws_signature from "./jws.signature.js";
import key from "./key.js";



async function verify(context: Context): Promise<Context> {

    /**
     * 
     * verify assumes that the JWS object has already been fully decoded
     * 
     * Required for signature validation:
     * 
     *  1. Signature bytes from context.jws.signature
     *  2. context.jws.header.kid to match against public key
     *  3. public key with matching kid
     *  4. first two segments of the context.jwscompact string or comtext.flat
     *  5. crypto signature verification api
     * 
     */

    const { log } = context;
    log.label = 'SIGNATURE';

    // the data to check the signature against
    const compact = context.compact;
    const flat = context.flat;
    if (!compact && !(flat.header || flat.payload)) {
        log.fatal(`context.compact or context.flat required to check signature`, ErrorCode.JWS_COMPACT_MISSING);
        return context;
    }

    const signature = context.jws.signature;
    if (!(signature instanceof Uint8Array)) {
        log.fatal(`Context.jws.signature is not a Uint8Array`, ErrorCode.JWS_COMPACT_MISSING);
        return context;
    }

    const kid = (context.jws.header as JWSHeader)?.kid;
    if (!utils.is.base64url(kid)) {
        log.fatal(`Context.jws.header.kid is not a base64url string`, ErrorCode.JWS_COMPACT_MISSING);
        return context;
    }

    const iss = (context.jws.payload as JWSPayload)?.iss;
    if (!(typeof iss === 'string')) {
        log.fatal(`Context.jws.payload.iss is not a string`, ErrorCode.JWS_PAYLOAD_ISS_MISSING);
        return context;
    }

    const info: { issuer: Issuer, key: JWK } | undefined = directory.lookupKey(iss, kid, context);
    log.label = 'SIGNATURE';
    if (!info) {
        // lookupKey will add appropriate errors to the log upon failure
        return context;
    }

    // remove the 3rd, signature, segment
    const toBeSigned = compact ? compact.split('.', 2).join('.') : `${flat.header}.${flat.payload}`;


    const verified = await checkSignature(toBeSigned, signature, info.key, context).catch(error => {
        log.fatal(`Signature check error ${error.toString()}`, ErrorCode.SIGNATURE_INVALID);
        return false;
    });


    context.signature = {
        issuer: utils.clone(info.issuer),  // clone so caller can't modify 
        key: utils.clone(info.key),
        verified
    };

    if (verified === false) {
        log.fatal('Signature could not be verified', ErrorCode.SIGNATURE_INVALID);
    }

    //
    // This doesn't do anything but assign the context.fhirbundle property to 
    //
    await fhir.decode(context);

    return context;


    /**
     * 
     * Find the required key. We can get it several ways:
     * 
     *  1. User supplies nothing:
     *     - keys[] is downloaded from context.jws.payload.iss
     *     - keys[] are scanned for kid === context.jws.header.kid
     *     - warning issued as this could have been issues/signed by anyone
     *  
     *  2. User supplies context.options.keys[] list:
     *     - keys[] are scanned for kid === context.jws.header.kid 
     *     - kid for keys is computed if missing
     *     - no downloads
     * 
     *  3. User supplies contest.options.issuers[] list:
     *     - issuers[] are scanned for .iss === context.jws.payload.iss   
     *     - keys[] are downloaded from context.jws.payload.iss
     *     - keys[] are scanned for kid === context.jws.header.kid
     * 
     *  4. User supplies context.options.directory:
     *     - directory is scanned for .iss === context.jws.payload.iss && .kid === context.jws.header.kid
     *     - no downloads
     * 
     *  5. User supplies url to a directory
     *     - directory downloaded
     *     - same as options 4.
     * 
     */

}

async function checkSignature(jws: string, signature: Uint8Array, publicKey: JWK, context: Context): Promise<boolean> {

    const { log } = context;
    log.label = 'SIGNATURE';

    const jwsBytes = convert.textToBytes(jws);

    if (!(await key.validate.key(publicKey, false, context))) {
        return false;
    }

    const cryptoKey = await subtle.importKey("jwk", publicKey as JsonWebKey, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]).catch((error: Error) => {
        log.fatal(`subtle.importKey() error ${error.toString()}`, ErrorCode.CRYPTO_FAILURE);
    });

    const validated = !!cryptoKey && await subtle.verify({ name: "ECDSA", hash: { name: "SHA-256" } }, cryptoKey, signature, jwsBytes).catch((error: Error) => {
        log.fatal(`subtle.verify() error ${error.toString()}`, ErrorCode.CRYPTO_FAILURE);
        return false;
    });

    return validated;
};


async function sign(context: Context): Promise<Context> {

    const { log } = context;
    log.label = 'SIGNATURE';
    const { privateKey } = context.options;

    if (!privateKey || !key.validate.key(privateKey, true, context)) {
        return log.fatal(`options.privateKey is required for signature and must be a JWK private key`, ErrorCode.JWS_ENCODE_FAIL);
    }

    if (!context.jws.payload || jws_payload.validate(context).log.isFatal) {
        // clear the upstream encodings so that there is no confusion about this signature failure
        context.qr = context.shc = context.flat.header = context.flat.payload = context.flat.signature = context.jws.signature = undefined;
        return context;
    }

    // TODO: should we always generate a fresh header even if one exists?
    // generates a new header. Requires private key for .kid computation. Clears upstream encodings.
    if (!context.jws.header) {
        jws_header.generate(context);
    }

    jws_header.encode(context);
    jws_payload.encode(context);

    // clear so there is no previous result after a failure
    context.jws.signature = context.flat.signature = undefined;

    const toSign = convert.textToBytes(`${context.flat.header}.${context.flat.payload}`);

    const cryptoKey = await subtle.importKey("jwk", privateKey as JsonWebKey, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]).catch((error: Error) => {
        log.fatal(`subtle.importKey() error ${error.toString()}`, ErrorCode.CRYPTO_FAILURE);
        return undefined;
    });

    if (!cryptoKey) return context;

    const signature = await subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, cryptoKey, toSign).catch((error: Error) => {
        log.fatal(`subtle.sign() error ${error.toString()}`, ErrorCode.CRYPTO_FAILURE);
        return undefined;
    });

    if (!signature) return context;

    context.jws.signature = new Uint8Array(signature);
    jws_signature.encode(context);

    return context;

}



export default { verify, sign }