import { ErrorCode } from "./error.js";
import Context from "./context.js";
import {is} from "./utils.js";
import jws_header from "./jws.header.js";
import jws_payload from "./jws.payload.js";
import jws_signature from "./jws.signature.js";
import header from "./jws.header.js";
import payload from "./jws.payload.js";


const label = 'JWS';


function validate(context: Context): Context {

    const log = context.log();
    log.label = label;
    const jws = context.jws;

    //
    // jws must be an Object
    //  
    if (!is.object(jws)) {
        return log.fatal("JWS is not an Object.", ErrorCode.PARAMETER_INVALID);
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

    const log = context.log(label);

    if (validate(context).log().isFatal) return context;

    header.encode(context);
    if (log.isFatal) context;

    payload.encode(context);
    if (log.isFatal) context;

    jws_signature.encode(context);
    if (log.isFatal) context;

    return context;
}


export default { encode, validate };
