import constants from "./constants.js";
import Context from "./context.js";
import { ErrorCode } from "./error.js";
import { JWSPayload, FhirBundle } from "./types.js";
import { is } from "./utils.js";


const FHIR_VERSION_PATTERN = /\d+\.\d+\.\d+/;

const LABEL = 'FHIRBUNDLE';


function validate(context: Context): Context {

    const log = context.log(LABEL);

    if (!context.fhirBundle || !is.object(context.fhirBundle)) {
        return log.fatal(`context.fhirBundle is required and must be an object`, ErrorCode.FHIR_VALIDATION_ERROR);
    }

    const fb = context.fhirBundle;

    if (!fb.resourceType || fb.resourceType !== 'Bundle') {
        log.error(`context.fhirBundle.resourceType must equal 'Bundle'`, ErrorCode.FHIR_VALIDATION_ERROR);
    }

    if (!fb.type || fb.type !== 'collection') {
        log.error(`context.fhirBundle.type must equal 'collection'`, ErrorCode.FHIR_VALIDATION_ERROR);
    }

    if (!fb.entry || !(fb.entry instanceof Array)) {
        return log.fatal(`context.fhirBundle.entry must be an Array`, ErrorCode.FHIR_VALIDATION_ERROR);
    }

    fb.entry.forEach((entry, index) => {

        if (!entry.fullUrl || !/resource:\d+/.test(entry.fullUrl)) {
            log.error(`context.fhirBundle.entry[${index}].fullUrl must equal 'resource:#'`, ErrorCode.FHIR_VALIDATION_ERROR);
        }

        if (!entry.resource || !is.object(entry.resource)) {
            log.error(`context.fhirBundle.entry[${index}].resource must be an object'`, ErrorCode.FHIR_VALIDATION_ERROR);
        } else {

            const r = entry.resource;

            if (!r.resourceType || typeof r.resourceType !== 'string') {
                log.error(`context.fhirBundle.entry[${index}].resource.resourceType must be a string`, ErrorCode.FHIR_VALIDATION_ERROR);
            }
        }
    });

    // TODO: add fhir schema validation

    return context;
}


function decode(context: Context): Context {

    const log = context.log();
    log.label = LABEL;

    context.fhirBundle = context.jws.payload?.vc?.credentialSubject?.fhirBundle;

    return context;
}


function encode(context: Context): Context {

    const { options } = context;
    const log = context.log(LABEL);


    let { nbf, iss, rid, fhirVersion } = options.encode ?? {};

    if (nbf === undefined) nbf = Date.now();

    // TODO: check private key only if we're chaining encode()
    // if (!privateKey || !key.validate.key(privateKey, true, context)) {
    //     return log.fatal(`options.privateKey is required and must be a JWK private key`, ErrorCode.JWS_ENCODE_FAIL);
    // }

    if (!iss || typeof iss !== 'string') {
        log.fatal(`options.encode.iss is required and must be a string`, ErrorCode.PARAMETER_INVALID);
    }

    if (nbf && typeof nbf !== 'number') {
        log.fatal(`options.encode.nbf must be a Number representing a date in milliseconds`, ErrorCode.PARAMETER_INVALID);
    }

    if (rid && typeof rid !== 'string') {
        log.fatal(`options.encode.rid must be a string`, ErrorCode.PARAMETER_INVALID);
    }

    if (fhirVersion && (typeof fhirVersion !== 'string' || !FHIR_VERSION_PATTERN.test(fhirVersion))) {
        log.fatal(`options.encode.fhirVersion must be a string of form ${FHIR_VERSION_PATTERN.toString()}`, ErrorCode.PARAMETER_INVALID);
    }

    if (log.isFatal) return context;

    if (validate(context).log().isFatal) return context;

    const fhirBundle = context.fhirBundle as FhirBundle;

    fhirVersion = fhirVersion || constants.DEFAULT_FHIRVERSION;

    const payload: JWSPayload = {

        iss: iss as string,
        nbf: nbf as number,
        vc: {
            type: [
                "https://smarthealth.cards#health-card",
                "https://smarthealth.cards#immunization",
                "https://smarthealth.cards#covid19"
            ],
            credentialSubject: {
                fhirVersion: fhirVersion,
                fhirBundle: fhirBundle
            }
        }
    }

    if (rid) {
        payload.rid = rid;
    }

    context.jws.payload = payload;

    return context;
}


export default { decode, encode, validate };