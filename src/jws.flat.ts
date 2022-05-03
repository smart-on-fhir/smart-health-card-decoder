import Context from "./context.js";
import { ErrorCode } from "./error.js";
import { is } from "./utils.js";
import jws_header from "./jws.header.js";
import jws_payload from "./jws.payload.js";
import jws_signature from "./jws.signature.js";
import jws_compact from "./jws.compact.js";


const LABEL = 'JWS.flat';


function validate(context: Context): Context {
    const log = context.log(LABEL);

    if (!is.base64url(context.flat.header)) {
        log.fatal(`header parameter is not base64url`, ErrorCode.PARAMETER_INVALID);
    }

    if (!is.base64url(context.flat.payload)) {
        log.fatal(`payload parameter is not base64url`, ErrorCode.PARAMETER_INVALID);
    }

    if (!is.base64url(context.flat.signature)) {
        log.fatal(`signature parameter is not base64url`, ErrorCode.PARAMETER_INVALID);
    }

    return context;
}

function decode(context: Context): Context {
    const log = context.log(LABEL);

    if (validate(context).log().isFatal) return context;

    jws_header.decode(context);
    jws_payload.decode(context);
    jws_signature.decode(context);

    return context;
}

async function encode(context: Context): Promise<Context> {
    const log = context.log(LABEL);

    if (validate(context).log().isFatal) return context;

    context.compact = `${context.flat.header}.${context.flat.payload}.${context.flat.signature}`;

    if (context?.options?.chain !== false) await jws_compact.encode(context);

    return context;
}

export default { encode, decode, validate };
