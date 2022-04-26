import Context from "./context.js";
import { ErrorCode } from "./error.js";
import fhir from "./fhir.js";
import { JWSPayload, JWK, JWSHeader, IssuerInfo } from "./types.js";
import { is, clone } from "./utils.js";
import convert from "./convert.js";
import { sign as cryptoSign, verify as cryptoVerify } from "./crypto.js";
import jws_header from "./jws.header.js";
import jws_payload from "./jws.payload.js";
import jws_signature from "./jws.signature.js";
import key from "./key.js";

const LABEL = 'SIGNATURE';

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
     *  4. first two segments of the context.jwscompact string or context.flat
     *  5. crypto signature verification api
     * 
     */

    const log = context.log(LABEL);

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
    if (!is.base64url(kid)) {
        log.fatal(`Context.jws.header.kid is not a base64url string`, ErrorCode.JWS_COMPACT_MISSING);
        return context;
    }

    const iss = (context.jws.payload as JWSPayload)?.iss;
    if (!(typeof iss === 'string')) {
        log.fatal(`Context.jws.payload.iss is not a string`, ErrorCode.JWS_PAYLOAD_ISS_MISSING);
        return context;
    }

    const nbf = (context.jws.payload as JWSPayload)?.nbf;
    if (!(typeof nbf === 'number')) {
        log.fatal(`Context.jws.payload.nbf is not a number`, ErrorCode.JWS_PAYLOAD_NBF_MISSING);
        return context;
    }

    const rid = (context.jws.payload as JWSPayload)?.vc?.rid;
    if (rid && (typeof rid !== 'string' || !/^[A-Za-z0-9_-]+\.?\d*$/.test(rid))) {
        log.fatal(`Context.jws.payload.rid is not a string matching pattern ${/^[A-Za-z0-9_-]+\d*$/.toString()}`, ErrorCode.JWS_PAYLOAD_ISS_MISSING);
        return context;
    }

    const info: IssuerInfo | undefined = context.directory?.find(iss, kid);
    log.label = 'SIGNATURE';
    if (!info) {
        if (!context.directory) {
            log.fatal(`No Directory present. Cannot verifiy signature with public keys.`, ErrorCode.DIRECTORY_MISSING);
        } else {
            log.fatal(`No matching issuer/key in Directory. Signature cannot be verified.`, ErrorCode.DIRECTORY_ISSUER_NOT_FOUND);
        }
        return context;
    }

    // remove the 3rd, signature, segment
    const toBeSigned = compact ? compact.split('.', 2).join('.') : `${flat.header}.${flat.payload}`;


    let verified = await checkSignature(toBeSigned, signature, info.keys[0], context).catch(error => {
        log.fatal(`Signature check error ${error.toString()}`, ErrorCode.SIGNATURE_INVALID);
        return false;
    });


    if (verified === false) {
        log.fatal('Signature could not be verified', ErrorCode.SIGNATURE_INVALID);
    }


    context.signature = {
        issuer: clone(info.issuer),  // clone so caller can't modify 
        key: clone(info.keys[0]),
        verified
    };


    //
    // This doesn't do anything but assign the context.fhirBundle property to 
    //
    await fhir.decode(context);

    return context;

}

async function checkSignature(jws: string, signature: Uint8Array, publicKey: JWK, context: Context): Promise<boolean> {

    const log = context.log();
    log.label = 'SIGNATURE';

    const jwsBytes = convert.textToBytes(jws);

    if (!(await key.validate.key(publicKey, false, context))) {
        return false;
    }

    const validated = await cryptoVerify(publicKey, signature, jwsBytes).catch(err => {
        log.fatal(`crypto.verify error ${err.toString()}`, ErrorCode.CRYPTO_FAILURE);
        return false;
    });

    return validated;
};

async function sign(context: Context): Promise<Context> {

    const log = context.log(LABEL);

    const { privateKey } = context.options;

    if (!privateKey || !key.validate.key(privateKey, true, context)) {
        return log.fatal(`options.privateKey is required for signature and must be a JWK private key`, ErrorCode.JWS_ENCODE_FAIL);
    }

    if (!context.jws.payload || jws_payload.validate(context).log().isFatal) {
        // clear the upstream encodings so that there is no confusion about this signature failure
        context.qr = context.shc = context.flat.header = context.flat.payload = context.flat.signature = context.jws.signature = undefined;
        return context;
    }

    // TODO: should we always generate a fresh header even if one exists?
    // generates a new header. Requires private key for .kid computation. Clears upstream encodings.
    if (!context.jws.header) {
        await jws_header.generate(context);
    }

    jws_header.encode(context);
    jws_payload.encode(context);

    // clear so there is no previous result after a failure
    context.jws.signature = context.flat.signature = undefined;

    const toSign = convert.textToBytes(`${context.flat.header}.${context.flat.payload}`);


    const signature = await cryptoSign(privateKey, toSign).catch(err => {
        log.fatal(`crypto.sign error ${err.toString()}`, ErrorCode.CRYPTO_FAILURE);
        return undefined;
    });

    if (!signature) return context;

    context.jws.signature = new Uint8Array(signature);
    jws_signature.encode(context);

    return context;

}

export default { verify, sign }
