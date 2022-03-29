// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { FhirBundle } from '../src/types';
import { checkErrors } from "./utils.js";
import Context from '../src/context';
import fhir from '../src/fhir';
import jws_payload from '../src/jws.payload';
import { ErrorCode } from '../src/error';


const validFhir: FhirBundle = { resourceType: "Bundle", type: "collection", entry: [{ fullUrl: "resource:0", resource: { resourceType: "Patient", name: [{ family: "Anyperson", given: ["John", "B."] }], birthDate: "1951-01-20" } }, { fullUrl: "resource:1", resource: { resourceType: "Immunization", status: "completed", vaccineCode: { coding: [{ system: "http://hl7.org/fhir/sid/cvx", code: "207" }] }, patient: { reference: "resource:0" }, occurrenceDateTime: "2021-01-01", performer: [{ actor: { display: "ABC General Hospital" } }], lotNumber: "0000001" } }, { fullUrl: "resource:2", resource: { resourceType: "Immunization", status: "completed", vaccineCode: { coding: [{ system: "http://hl7.org/fhir/sid/cvx", code: "207" }] }, patient: { reference: "resource:0" }, occurrenceDateTime: "2021-01-29", performer: [{ actor: { display: "ABC General Hospital" } }], lotNumber: "0000007" } }] };
const privateKey = { "kty": "EC", "kid": "d630duSMWmVfmOtrMKZX6izJfcampjK1h0D4jrXxJwU", "use": "sig", "alg": "ES256", "crv": "P-256", "x": "IpNzj8m7NEZdNG4mdEsTmDWFFyKLE7PmtBLWLGIoJuA", "y": "mVqRexUnULniMBghiSfb8L3HDZSTxhdKWfIcP6Tvabs", "d": "qYg7yrhjPYGJNHc0e9xYNodLaKQvVNG6cShRyhwtwHQ" };

test('fhir-encode-valid', async () => {
    const context = new Context();
    context.fhirbundle = validFhir;
    context.options.encode = {
        //privateKey : privateKey,
        iss: "https://spec.smarthealth.cards/examples/issuer"
    }
    fhir.encode(context);               // gets you a jws.payload (more of a wrapper than an encoding)
    jws_payload.validate(context);
    checkErrors(context);
});

test('fhir-encode-valid-with-options', async () => {
    const context = new Context();
    context.fhirbundle = validFhir;
    context.options = {
        encode: {
            iss: "https://spec.smarthealth.cards/examples/issuer",
            fhirVersion: "1.0.0",
            nbf: Date.parse('1/1/2020'),
            rid: "MKyCxh7p6uQ"  // TODO: does rid have special encoding?
        }
    }
    fhir.encode(context);
    jws_payload.validate(context);
    expect(context.jws.payload?.iss).toEqual(context.options?.encode?.iss);
    expect(context.jws.payload?.rid).toEqual(context.options?.encode?.rid);
    expect(context.jws.payload?.nbf).toEqual(context.options?.encode?.nbf);
    expect(context.jws.payload?.vc.credentialSubject.fhirVersion).toEqual(context.options?.encode?.fhirVersion);
    checkErrors(context);
});

test('fhir-encode-valid-with-invalid-options', async () => {
    const context = new Context();
    context.fhirbundle = validFhir;
    context.options.encode = {
        iss: {} as unknown as string,
        fhirVersion: "41",
        nbf: '1/1/2020' as unknown as number,
        rid: 123 as unknown as string,
    }
    fhir.encode(context);
    checkErrors(context, [ErrorCode.PARAMETER_INVALID, ErrorCode.PARAMETER_INVALID, ErrorCode.PARAMETER_INVALID, ErrorCode.PARAMETER_INVALID]);
});

test('fhir-encode-no-iss', async () => {
    const context = new Context();
    context.fhirbundle = validFhir;
    fhir.encode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('fhir-encode-no-iss', async () => {
    const context = new Context();
    context.fhirbundle = validFhir;
    fhir.encode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});
