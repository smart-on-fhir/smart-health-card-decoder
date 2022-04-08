// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import constants from "./constants.js";
import Context from "./context.js";
import { defaults } from "./cvx.js";
import { ErrorCode } from "./error.js";
import { ImmunizationRecord, Immunization, BundleEntry, Patient, PatientResource, ImmunizationResource, JWSPayload, FhirBundle } from "./types.js";
import utils from "./utils.js";


const FHIR_VERSION_PATTERN = /\d+\.\d+\.\d+/;

const label = 'FHIRBUNDLE';


function validate(context: Context): Context {

    const { log } = context;
    log.label = label;

    if (!context.fhirbundle || !utils.is.object(context.fhirbundle)) {
        return log.fatal(`context.fhirbundle is required and must be an object`, ErrorCode.FHIR_VALIDATION_ERROR);
    }

    const fb = context.fhirbundle;

    if (!fb.resourceType || fb.resourceType !== 'Bundle') {
        log.error(`context.fhirbundle.resourceType must equal 'Bundle'`, ErrorCode.FHIR_VALIDATION_ERROR);
    }

    if (!fb.type || fb.type !== 'collection') {
        log.error(`context.fhirbundle.type must equal 'collection'`, ErrorCode.FHIR_VALIDATION_ERROR);
    }

    if (!fb.entry || !(fb.entry instanceof Array)) {
        return log.fatal(`context.fhirbundle.entry must be an Array`, ErrorCode.FHIR_VALIDATION_ERROR);
    }

    fb.entry.forEach((entry, index) => {

        if (!entry.fullUrl || !/resource:\d+/.test(entry.fullUrl)) {
            log.error(`context.fhirbundle.entry[${index}].fullUrl must equal 'resource:#'`, ErrorCode.FHIR_VALIDATION_ERROR);
        }

        if (!entry.resource || !utils.is.object(entry.resource)) {
            log.error(`context.fhirbundle.entry[${index}].resource must be an object'`, ErrorCode.FHIR_VALIDATION_ERROR);
        } else {

            const r = entry.resource;

            if (!r.resourceType || typeof r.resourceType !== 'string') {
                log.error(`context.fhirbundle.entry[${index}].resource.resourceType must be a string`, ErrorCode.FHIR_VALIDATION_ERROR);
            }
        }
    });

    // TODO: add fhir schema validation

    return context;
}


function decode(context: Context): Context {

    const { log } = context;
    log.label = label;

    context.fhirbundle = context.jws.payload?.vc?.credentialSubject?.fhirBundle;

    return context;
}


function encode(context: Context): Context {

    const { options, log } = context;
    log.label = label;

    let { nbf, iss, rid, fhirVersion } = options.encode ?? {};

    if(nbf === undefined) nbf = Date.now();

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

    if (validate(context).log.isFatal) return context;

    const fhirBundle = context.fhirbundle as FhirBundle;

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