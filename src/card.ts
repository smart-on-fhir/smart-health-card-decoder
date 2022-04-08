// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Context from "./context.js";
import { defaults as cvxDefaultCodes } from "./cvx.js";
import { BundleEntry, Immunization, ImmunizationCard, ImmunizationRecord, ImmunizationResource, Patient, PatientResource } from "./types.js";


export default card;


function card(context: Context) : ImmunizationCard | undefined {

    const issuer = context.signature?.issuer?.name || context.signature?.issuer?.iss || '';
    const verified = !!context.signature?.verified;
    const immunizations = getImmunizationRecord(context);

    if(!immunizations) {
        return;
    }

    return {
        issuer,
        verified,
        patient: immunizations.patient,
        immunizations: immunizations.immunizations
    };

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

    const immunizations: Immunization[] = immunizationEntries.map(ie => parseImmunizationEntry(ie)).sort((a, b) => +a.date - +b.date);
    immunizations.forEach((im, i) => im.dose = i + 1);

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
        dose: 0,
        date: new Date(resource.occurrenceDateTime),
        manufacturer: cvxDefaultCodes[parseInt(resource.vaccineCode.coding?.[0]?.code)]?.manufacturer ?? 'unknown',
        performer: resource.performer?.[0]?.actor?.display ?? 'unknown'
    };
}
