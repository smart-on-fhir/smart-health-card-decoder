// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Context from "./context.js";
import signature_verifier from "./signature.js";
import utils from "./utils.js";
import fhir from "./fhir.js";
import { Options, JWSCompact, QRUrl, ShcNumeric, VerificationRecord } from "./types.js";
import { decode, validate } from "./index.js";


/**
 * Decodes and validates an encoded __SMART Health Card__:
 * 
 * @param {string} code - encoded SMART Health Card in one of the following forms:
 * 
 *    _ShcNumeric_ (string) : `'shc:/5676290952432060346029243740...'`
 * 
 *    _QRUrl_ (string) : `'data:image/png;base64,iVBORw0KGoAAAANS...'`
 * 
 *    _JWSCompact_ (string) : `'eyJ6aXAiOiJERUYiONiIsImtpZI6IjNLZ...'`
 * 
 * @param {object} options - Verify() requires the `{directory: ...}` or `{keys: ...}` options to be provided for signature verification.
 * 
 * @returns {object} Promise\<VerificationRecord\> - object containing immunization data extracted from the SMART Health Card
 * 
 * @example
 * 
 * ```
 * import {verify, directory} from 'smart';
 * const directory = directory.download(); // vci daily snapshot
 * const shc = 'shc:/567629095243206034602924374 ...';
 * const verificationRecord = await verify(shc, { directory });
 * 
 * // returns:
{
    verified: true,  // signature verfied using provided public key
    immunizations: {
        patient: {
            name: "Anyperson, John B.",
            dob: new Date("1951-01-20T00:00:00.000Z")
        },
        immunizations: [
            {
                dose: 1,
                date: new Date("2021-01-01T00:00:00.000Z"),
                manufacturer: "Moderna US.",
                performer: "ABC General Hospital"
            },
            {
                dose: 2,
                date: new Date("2021-01-29T00:00:00.000Z"),
                manufacturer: "Moderna US.",
                performer: "ABC General Hospital"
            }
        ]
    },
    issuer: "smarthealth.cards"
}
 * ```
 * 
 * @async
 */
async function verify(code: ShcNumeric | QRUrl | JWSCompact, options: Options): Promise<{ record: VerificationRecord, qr: QRUrl }> {

    const artifactType = utils.determineArtifact(code);
    let context = new Context(options);

    switch (artifactType) {

        case 'qr':
            context.qr = code;
            context = await decode.qr(context);
            break;

        case 'shc':
            context.shc = code;
            context = await decode.shc(context);
            break;

        case 'jws.compact':
            context.compact = code;
            context = decode.jws.compact(context);
            break;

        default:
            context = new Context(options);
    }

    const jws = context.jws;
    jws && validate.jws(context);


    if (!jws) {
        return { record: { verified: false, errors: context.errors, immunizations: undefined, issuer: '' }, qr: '' };
    }

    await signature_verifier.verify(context);

    const issuer = context.signature?.issuer?.name || context.signature?.issuer?.iss || '';
    const errors = context.errors;
    const verified = !!context.signature?.verified;
    const immunizations = fhir.getImmunizationRecord(context);


    return {
        record: {
            verified,
            errors,
            immunizations,
            issuer
        },
        qr: context.qr ?? ''
    }

}
export default verify;
