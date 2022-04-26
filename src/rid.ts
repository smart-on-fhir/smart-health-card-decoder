import constants from "./constants.js";
import Context from "./context.js";
import convert from "./convert.js";
import { hash } from "./crypto.js";
import { ErrorCode } from "./error.js";
import { JWS } from "./types";
import { is } from "./utils.js";


export function parse(ridString: string): { rid: string, seconds: number } {
    let [rid, secondsStr] = ridString.split('.');
    let seconds = parseInt(secondsStr);
    seconds = isNaN(seconds) ? constants.MAX_DATE_SECONDS : seconds;
    return {
        rid,
        seconds
    }
}

export function validate(ridString: string, context: Context): boolean {

    const log = context.log();
    let result = true;

    const [rid, seconds, invalid] = ridString.split('.');

    if (is.defined(invalid)) {
        log?.error(`Revocation ID rid can have at most one ".": ${ridString}`, ErrorCode.CRL_INVALID_PROPERTY)
    }

    if (!/^[A-Za-z0-9_-]+$/.test(rid)) {
        result = false;
        log?.error(`Revocation ID rid SHALL use base64url alphabet: ${rid}`, ErrorCode.CRL_INVALID_PROPERTY)
    }

    if (rid.length > 24) {
        result = false;
        log?.error(`Revocation ID rid SHALL be no longer than 24 characters: ${rid}`, ErrorCode.CRL_INVALID_PROPERTY);
    }

    if (is.defined(seconds)) {

        // we know it's an integer because the decimal would have been split off into the 'invalid' variable
        const intSeconds = Number.parseInt(seconds);

        if (isNaN(intSeconds)) {
            log?.error(`Revocation ID timestamp is not an integer ${seconds}`, ErrorCode.CRL_INVALID_PROPERTY);
            return false;
        }

        // we cannot convert to milliseconds if larger than this
        if (intSeconds > constants.MAX_DATE_SECONDS) {
            log?.error(`rid timestamp ${seconds} exceeds the maximum number of seconds allowed ${constants.MAX_DATE_SECONDS.toString()}. Perhaps it is in milliseconds?`, ErrorCode.CRL_INVALID_PROPERTY);
            return false;
        }

        const timestamp = parseInt(seconds) * 1000; // convert seconds to milliseconds
        if (timestamp > Date.now()) {
            log?.warn(`Revocation ID's timestamp is in the future: ${new Date(timestamp).toString()}`, ErrorCode.NOT_YET_VALID);
        }
    }

    return result;
}

// Generates an rid for legacy shc that don't contain an rid
// You may substitute your own function for custom rid computations
export async function generate(context: Context): Promise<string>;
export async function generate(custom: (jws: JWS) => Promise<string>, context: Context): Promise<string>;
export async function generate(functionOrContext: ((jws: JWS) => Promise<string>) | Context, optContext?: Context): Promise<string> {

    let func: (jws: JWS) => Promise<string>, context: Context;

    if (typeof functionOrContext === 'function') {
        func = functionOrContext as (jws: JWS) => Promise<string>;
        context = optContext as Context;
    } else if ((functionOrContext as Context) instanceof Context) {
        func = default_generate;
        context = functionOrContext;
    } else {
        throw new Error(`Invalid parameters`);
    }

    return await func(context.jws);
}


async function default_generate(jws: JWS): Promise<string> {

    /* 
    * Default rid generation from https://github.com/smart-on-fhir/health-cards/blob/main/rfcs/002-legacy-shc-revocation.md#fhir-bundle-digest
    */

    const revokedFhirBundle = jws.payload?.vc.credentialSubject.fhirBundle;
    const canonicalized = JSON.stringify(revokedFhirBundle);
    const preimage = convert.textToBytes(canonicalized);
    const digest = await hash(preimage);
    const truncatedDigest = convert.base64ToBytes(digest).slice(0, 8);
    const rid = convert.bytesToBase64(truncatedDigest, true);

    return rid;
}
