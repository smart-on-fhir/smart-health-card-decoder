// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { checkErrors } from "./utils.js";
import Context from '../src/context.js';
import fhir from '../src/fhir.js';
import jws_payload from '../src/jws.payload.js';
import { ErrorCode } from '../src/error.js';
import {data} from './constants.js';


test('fhir-encode-valid', async () => {
    const context = new Context();
    context.fhirBundle = data.fhir;
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
    context.fhirBundle = data.fhir;
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
    context.fhirBundle = data.fhir;
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
    context.fhirBundle = data.fhir;
    fhir.encode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('fhir-encode-no-iss', async () => {
    const context = new Context();
    context.fhirBundle = data.fhir;
    fhir.encode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});
