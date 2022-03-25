// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Context from "./context.js";
import { ErrorCode } from "./error.js";
import { ImmunizationRecord, Immunization, BundleEntry, Patient, PatientResource, ImmunizationResource, JWSPayload, FhirBundle } from "./types.js";
import utils from "./utils.js";


const DEFAULT_FHIRVERSION = "4.0.1";

const FHIR_VERSION_PATTERN = /\d+\.\d+\.\d+/;

const label = 'FHIRBUNDLE';


function validate(context: Context): Context {

    const { log } = context;
    log.label = label;

    if (!context.fhirbundle || !utils.is.object(context.fhirbundle)) {
        return log.fatal(`context.fhirbundle is required and must be an object`, ErrorCode.FHIR_VALIDATION_ERROR);
    }

    // TODO : additional FHIR validation

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
    let { nbf, iss, rid, fhirVersion, privateKey } = options;

    // TODO: check private key only if we're chaining encode()
    // if (!privateKey || !key.validate.key(privateKey, true, context)) {
    //     return log.fatal(`options.privateKey is required and must be a JWK private key`, ErrorCode.JWS_ENCODE_FAIL);
    // }

    if (!iss || typeof iss !== 'string') {
        log.fatal(`options.iss is required and must be a string`, ErrorCode.PARAMETER_INVALID);
    }

    if (nbf && typeof nbf !== 'number') {
        log.fatal(`options.nbf must be a Number representing a date in milliseconds`, ErrorCode.PARAMETER_INVALID);
    }

    if (rid && typeof rid !== 'string') {
        log.fatal(`options.rid must be a string`, ErrorCode.PARAMETER_INVALID);
    }

    if (fhirVersion && (typeof fhirVersion !== 'string' || !FHIR_VERSION_PATTERN.test(fhirVersion))) {
        log.fatal(`options.fhirVersion must be a string of form ${FHIR_VERSION_PATTERN.toString()}`, ErrorCode.PARAMETER_INVALID);
    }

    if (log.isFatal) return context;

    if (validate(context).log.isFatal) return context;

    const fhirBundle = context.fhirbundle as FhirBundle;

    fhirVersion = fhirVersion || DEFAULT_FHIRVERSION;

    const payload: JWSPayload = {

        iss : iss as string,
        nbf : nbf as number,
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

function getImmunizationRecord(context: Context): ImmunizationRecord | undefined {

    const { log } = context;
    log.label = 'JWS';

    const fhirBundle = context.fhirbundle;

    if (!fhirBundle) {
        log.error(`Fhir bundle not found in JWS.payload`);
        return;
    }

    const patientEntry = fhirBundle.entry.find(entry => entry.resource?.resourceType === 'Patient');

    if (typeof patientEntry === 'undefined') {
        log.error(`Patient entry not found in JWS.payload.entry[]`);
        return;
    }

    const patient = parsePatientEntry(patientEntry);
    const immunizationEntries = fhirBundle.entry.filter(entry => entry.resource?.resourceType === 'Immunization');

    if (!immunizationEntries || immunizationEntries.length === 0) {
        log.error(`Immunization entries not found in JWS.payload.entry[]`);
        return;
    }

    const immunizations: Immunization[] = immunizationEntries.map(ie => parseImmunizationEntry(ie));

    return {
        patient,
        immunizations
    }

}


function parsePatientEntry(entry: BundleEntry): Patient {
    const resource = entry.resource as PatientResource;
    const patientName = `${resource.name?.[0]?.family}, ${resource.name?.[0]?.given.join(' ')}`;
    const patientDob = new Date(resource.birthDate ?? '');
    return {
        name: patientName,
        dob: patientDob
    };
}


function parseImmunizationEntry(entry: BundleEntry): Immunization {
    const resource = entry.resource as ImmunizationResource;
    return {
        date: new Date(resource.occurrenceDateTime),
        code: resource.vaccineCode.coding?.[0]?.code?.toString(),
        system: resource.vaccineCode.coding?.[0]?.system,
        performer: resource.performer?.[0]?.actor?.display ?? 'unknown'
    };
}

export default { decode, encode, validate, getImmunizationRecord };