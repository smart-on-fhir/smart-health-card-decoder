import { ErrorCode } from "./error.js";
import Context from "./context.js";
import shc_encoder from "./shc.js";
import jws_flat from "./jws.flat.js";
import { JWSCompact } from "./types.js";

const label = 'JWS.compact';

const cjws = /^([a-zA-Z0-9_-]{2,})\.([a-zA-Z0-9_-]{2,})\.([a-zA-Z0-9_-]{2,})$/;


function decode(context: Context): Context {

    const { log } = context;
    log.label = label;

    if (validate(context).log.isFatal) return context;

    const compactJws = context.compact as JWSCompact;

    const [headerB64, payloadB64, signatureB64] = compactJws.split('.');

    context.flat.header = headerB64;
    context.flat.payload = payloadB64;
    context.flat.signature = signatureB64;

    if (context?.options?.chain !== false) jws_flat.decode(context);

    return context;
}


async function encode(context: Context): Promise<Context> {

    const { log } = context;
    log.label = 'JWS.compact';
    const jwscompact = context.compact;

    if (validate(context).log.isFatal) return context;

    const offset = '-'.charCodeAt(0);

    const shc = 'shc:/' + (jwscompact as JWSCompact)
        .split('')
        .map(c => c.charCodeAt(0) - offset)
        .flatMap(c => [Math.floor(c / 10), c % 10])
        .join('');

    context.shc = shc; 
    
    if (context?.options?.chain !== false) await shc_encoder.encode(context);

    return context;
}


function validate(context: Context): Context {

    const { log } = context;
    log.label = 'JWS.compact';

    const jwscompact = context.compact;

    if (typeof jwscompact !== 'string') {
        return log.fatal(`'compactJws' parameter not a string`, ErrorCode.PARAMETER_INVALID);
        // return context;
    }

    if (!cjws.test(jwscompact.trim())) {
        return log.fatal(`Invalid compact-JWS format. Expect [a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+`, ErrorCode.JWS_COMPACT_FORMAT_ERROR);
        //return context;
    };

    return context;
}

export default { encode, decode, validate };
