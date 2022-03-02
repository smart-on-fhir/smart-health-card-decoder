import { JWS, JWSPayload } from "./types";
import b64 from "./base64";
import { Artifact } from "./log";
import { inflateSync } from "fflate";
import ValidationContext from "./context";
import { ErrorCode } from "./error";
import utils from "./utils";


const base64urlPatternWS = /^\s*[\w-]+\s*$/;
const base64urlPattern = /[\w-]+/;


async function validate(context: ValidationContext): Promise<ValidationContext> {

    const {log} = context;
    log.artifact = Artifact.PAYLOAD;

    if(!context?.jws?.payload) {
        log.fatal('context.jws.payload not found. Cannot do validations.');
        return context;
    }

    const payload = context?.jws?.payload ?? {};

    if (!('iss' in payload)) {
        log.fatal(`JWS Payload missing 'issuer' ('iss') property.`);
        return context;
    }

    if (!('nbf' in payload)) {
        log.fatal(`JWS Payload missing 'not before' ('nbf') property.`);
        return context;
    }

    if (!('vc' in payload)) {
        log.fatal(`JWS Payload missing 'verifiable credential' ('vc') property.`);
        return context;
    }

    if ('exp' in payload) {
        log.fatal(`JWS Payload missing 'expiration' ('exp') property.`);
        return context;
    }

    return context;
}


function decode(payload: string, context: ValidationContext): ValidationContext {

    const {log} = context;
    log.artifact = Artifact.PAYLOAD;

    if(typeof payload !== 'string') {
        log.fatal(`payload parameter not a string`, ErrorCode.JWS_PAYLOAD_ERROR);
        return context;
    }

    if (!base64urlPatternWS.test(payload)) {
        log.fatal(`payload parameter not base64url format`, ErrorCode.JWS_PAYLOAD_ERROR);
        return context;
    };

    const base64url = payload.match(base64urlPattern)?.[0] ?? '';
    log.debug(`payload base64url:\n ${base64url}`);

    const arrayBuffer = b64.toArrayBuffer(base64url);
    log.debug(`payload ArrayBuffer:\n ${arrayBuffer}`);

    const inflatedUint8 = inflateSync(new Uint8Array(arrayBuffer));
    const utf8 = new TextDecoder("utf-8").decode(inflatedUint8);
    const jwsPayload = utils.parseJson<JWSPayload>(utf8);

    if (!jwsPayload) {
        log.fatal('JWS Payload could not be decoded.', ErrorCode.JWS_PAYLOAD_ERROR);
        return context;
    }

    context.jws = context.jws || {} as JWS;
    context.jws.payload = jwsPayload;

    return context;
}

export default { decode, validate };
