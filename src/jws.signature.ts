import { ErrorCode } from "./error";
import { Artifact } from "./log";
import b64 from  "./base64";
import ValidationContext from "./context";
import { JWS } from "./types";

const base64urlPatternWS = /^\s*[\w-]+\s*$/;
const base64urlPattern = /[\w-]+/;

function decode(signature: string, context: ValidationContext): ValidationContext {

    const {log} = context;
    log.artifact = Artifact.JWS;

    if(typeof signature !== 'string') {
        log.fatal(`signature parameter not a string`, ErrorCode.SIGNATURE_FORMAT_ERROR);
        return context;
    }

    if (!base64urlPatternWS.test(signature)) {
        log.fatal(`signature parameter not base64url format`, ErrorCode.SIGNATURE_FORMAT_ERROR);
        return context;
    };

    const base64url = signature.match(base64urlPattern)?.[0] ?? '';
    const arrayBuffer = b64.toArrayBuffer(base64url);
    const uint8Array = new Uint8Array(arrayBuffer);

    log.debug(`signature base64url:\n ${base64url}`);
    log.debug(`signature Uint8Array:\n ${uint8Array}`);

    context.jws = context.jws || {} as JWS;
    context.jws.signature = uint8Array;

    return context;
}

function validate(context: ValidationContext): ValidationContext {

    const {log} = context;
    log.artifact = Artifact.JWS;

    if(!(context?.jws?.signature instanceof Uint8Array)) {
        log.fatal(`JWS.signature not Uint8Array`, ErrorCode.INVALID_SIGNATURE);
    }

    if(!context.jwscompact) {
        log.fatal(`context.jwscompact required for signature verificaiton.`, ErrorCode.INVALID_SIGNATURE);
    }

    return context;
}

export default { decode, validate };