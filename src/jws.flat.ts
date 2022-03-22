import Context from "./context";
import { ErrorCode } from "./error";
import utils from "./utils";
import jws_header from './jws.header';
import jws_payload from './jws.payload';
import jws_signature from './jws.signature';


const label = 'JWS.flat';


function validate(context: Context): Context {
    const { log } = context;
    log.label = label;

    if (!utils.is.base64url(context.flat.header)) {
        log.fatal(`header parameter is not base64url`, ErrorCode.PARAMETER_INVALID);
    }

    if (!utils.is.base64url(context.flat.payload)) {
        log.fatal(`payload parameter is not base64url`, ErrorCode.PARAMETER_INVALID);
    }
  
    if (!utils.is.base64url(context.flat.signature)) {
        log.fatal(`signature parameter is not base64url`, ErrorCode.PARAMETER_INVALID);
    }

    return context;
}

function decode(context: Context): Context {
    const { log } = context;
    log.label = label;

    if (validate(context).log.isFatal) return context;

    jws_header.decode(context);
    jws_payload.decode(context);
    jws_signature.decode(context);

    return context;
}

function encode(context: Context): Context {
    const { log } = context;
    log.label = label;
    return context;
}

export default { encode, decode, validate };
