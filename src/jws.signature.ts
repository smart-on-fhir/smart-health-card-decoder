import { ErrorCode } from "./error.js";
import {is} from "./utils.js";
import Context from "./context.js";
import convert from "./convert.js";

const label = 'JWS.signature';

function decode(context: Context): Context {

    const log = context.log();
    log.label = label;
    const signature = context.flat.signature;

    //
    // signature param must be base64url encoded
    //    
    if (!is.base64url(signature)) {
        log.fatal(`signature parameter is not base64url`, ErrorCode.PARAMETER_INVALID);
        return context;
    };

    //
    // decode base64url to a Uint8Array
    // 
    const uint8Array = convert.base64ToBytes(signature.trim());

    log.debug(`signature base64url:\n ${signature}`);
    log.debug(`signature Uint8Array:\n ${uint8Array}`);

    context.jws.signature = uint8Array;

    return context;
}

function validate(context: Context): Context {

    const log = context.log();
    log.label = label;

    if (!(context.jws.signature instanceof Uint8Array)) {
        log.fatal(`JWS.signature is not Uint8Array`, ErrorCode.PARAMETER_INVALID);
        return context;
    }

    if (context.jws.signature?.length !== 64) {
        log.warn(`JWS.signature should be 64 bytes long for ES256 algorithm.`, ErrorCode.JWS_SIGNATURE_FORMAT_ERROR);
    }

    return context;
}

function encode(context: Context): Context {

    const log = context.log(label);

    if (validate(context).log().isFatal) return context;

    context.flat.signature = convert.bytesToBase64(context.jws.signature as Uint8Array, true);

    return context;
}


export default { encode, decode, validate };