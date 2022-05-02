import shc_validator from "./shc.js";
import qr_validator from "./qr.js";
import jws_validator from "./jws.js";
import jws_header from "./jws.header.js";
import jws_payload from "./jws.payload.js";
import jws_compact from "./jws.compact.js";
import jws_flat from "./jws.flat.js";
import jws_signature from "./jws.signature.js";
import Context from "./context.js";
import signature_verifier from "./signature.js";
import fhir from "./fhir.js";
import { ErrorCode, LogLevel } from "./log.js";
import { verify } from "./verify.js";
import card from "./card.js";
import { Directory } from '../src/directory.js';

type JWSEncode = {
    header: { (context: Context): Context },
    payload: { (context: Context): Context },
    signature: { (context: Context): Context },
    compact: { (context: Context): Promise<Context> },
    flat: { (context: Context): Promise<Context> },
    (context: Context): Context
};

const jwsEncode = jws_validator.encode as JWSEncode;
jwsEncode.header = jws_header.encode;
jwsEncode.payload = jws_payload.encode;
jwsEncode.signature = jws_signature.encode;
jwsEncode.compact = jws_compact.encode;
jwsEncode.flat = jws_flat.encode;

type JWSDecode = {
    header: { (context: Context): Context },
    payload: { (context: Context): Context },
    signature: { (context: Context): Context },
    compact: { (context: Context): Context },
    flat: { (context: Context): Context }
};

const jwsDecode = {} as JWSDecode;
jwsDecode.header = jws_header.decode;
jwsDecode.payload = jws_payload.decode;
jwsDecode.signature = jws_signature.decode;
jwsDecode.compact = jws_compact.decode;
jwsDecode.flat = jws_flat.decode;

type JWSValidate = {
    header: { (context: Context): Context },
    payload: { (context: Context): Context },
    signature: { (context: Context): Context },
    compact: { (context: Context): Context },
    flat: { (context: Context): Context },
    (context: Context): Context
};

const jwsValidate = jws_validator.validate as JWSValidate;
jwsValidate.header = jws_header.validate;
jwsValidate.payload = jws_payload.validate;
jwsValidate.signature = jws_signature.validate;
jwsValidate.compact = jws_compact.validate;
jwsValidate.flat = jws_flat.validate;


const validate = {
    qr: qr_validator.decode,
    shc: shc_validator.validate,
    jws: jwsValidate,
    fhir: fhir.validate,
}

const decode = {
    qr: qr_validator.decode,
    shc: shc_validator.decode,
    jws: jwsDecode
}

const encode = {
    shc: shc_validator.encode,
    jws: jwsEncode,
    fhir: fhir.encode
}

const signature = {
    verify: signature_verifier.verify,
    sign: signature_verifier.sign
}

const low = {
    encode,
    decode,
    validate,
    signature,
    card: card
}

export { verify, Directory, Context, LogLevel, ErrorCode, low };
