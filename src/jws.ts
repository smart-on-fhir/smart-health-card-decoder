import { ErrorCode } from "./error";
import Context from "./context";
import utils from "./utils";
import jws_header from './jws.header';
import jws_payload from './jws.payload';
import jws_signature from './jws.signature';
import header from './jws.header';
import payload from './jws.payload';
import key from './key';

const label = 'JWS';


function validate(context: Context): Context {

    const { log } = context;
    log.label = label;
    const jws = context.jws;

    //
    // jws must be an Object
    //  
    if (!utils.is.object(jws)) {
        return log.fatal("JWS is not an Object.", ErrorCode.PARAMETER_INVALID);
        //return context;
    }

    if (!('header' in jws)) {
        log.fatal("JWS is missing .header property", ErrorCode.JWS_MISSING_HEADER);
    } else {
        jws_header.validate(context);
    }

    if (!('payload' in jws)) {
        log.fatal("JWS is missing .payload property", ErrorCode.JWS_MISSING_PAYLOAD);
    } else {
        jws_payload.validate(context);
    }

    if (!('signature' in jws)) {
        log.fatal("JWS is missing .signature property", ErrorCode.JWS_MISSING_SIGNATURE);
    } else {
        jws_signature.validate(context);
    }

    return context;
}


function encode(context: Context): Context {

    const { log } = context;
    log.label = label;

    if (validate(context).log.isFatal) return context;

    header.encode(context);
    if (context.log.isFatal) context;

    payload.encode(context);
    if (context.log.isFatal) context;

    jws_signature.encode(context);
    if (context.log.isFatal) context;

    return context;
}


export default { encode, validate };
