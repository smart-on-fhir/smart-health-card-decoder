// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Context from "./context";
import { ShcNumeric, QRUrl, JWSCompact, Options, JWSFlat, Base64Url, DecodeResult } from "./types";
import utils from "./utils";
import qr_decoder from './qr.js';
import shc_decoder from './shc.js';
import compact_decoder from './jws.compact.js';
import flat_decoder from './jws.flat.js';
import jws_header from './jws.header.js';
import jws_payload from './jws.payload.js';
import jws_signature from './jws.signature.js';
import { ErrorCode } from "./error";
import fhir from "./fhir";


type artifacts = 'qr' | 'shc' | 'jws.compact' | 'jws.flat' | 'jws.header' | 'jws.payload' | 'jws.signature';

const validTypes = ['qr', 'shc', 'jws.compact', 'jws.flat', 'jws.header', 'jws.payload', 'jws.signature'];

async function decode(code: ShcNumeric | QRUrl | JWSCompact | JWSFlat): Promise<DecodeResult>
async function decode(code: ShcNumeric | QRUrl | JWSCompact | JWSFlat, options: Options): Promise<DecodeResult>
async function decode(code: ShcNumeric | QRUrl | JWSCompact | JWSFlat, type: artifacts): Promise<DecodeResult>
async function decode(code: ShcNumeric | QRUrl | JWSCompact | JWSFlat, type: artifacts, options: Options): Promise<DecodeResult>
async function decode(code: ShcNumeric | QRUrl | JWSCompact | JWSFlat, artifactOrOptions?: artifacts | Options, options?: Options): Promise<DecodeResult> {

    const context = new Context();

    let artifact = undefined;
    options = options || {};

    if (typeof artifactOrOptions === 'string') {
        artifact = artifactOrOptions;
    } else if (utils.is.object(artifactOrOptions)) {
        options = artifactOrOptions;
    }

    artifact = artifact || utils.determineArtifact(code);

    if (artifact && !validTypes.includes(artifact)) {
        return context.log.fatal(`Parameter 'type' is not a valid value (${validTypes.join('|')})`, ErrorCode.PARAMETER_INVALID);
    }

    switch (artifact) {

        case 'qr':
            context.qr = code as QRUrl;
            await qr_decoder.decode(context);
            break;

        case 'shc':
            context.shc = code as ShcNumeric;
            await shc_decoder.decode(context);
            break;

        case 'jws.compact':
            context.compact = code as JWSCompact;
            compact_decoder.decode(context);
            break;

        case 'jws.flat':
            context.flat = code as JWSFlat;
            flat_decoder.decode(context);
            break;
            
        case 'jws.header':
            context.flat.header = code as Base64Url;
            jws_header.decode(context);
            break;
            
        case 'jws.payload':
            context.flat.payload = code as Base64Url;
            jws_payload.decode(context);
            break;
            
        case 'jws.signature':
            context.flat.signature = code as Base64Url;
            jws_signature.decode(context);
            break;

        default:
            context.log.fatal(`Cannot determine artifact type from code`)
    }


    const decodeResult : DecodeResult = {};

    context.errors && (decodeResult.errors = context.errors);
    context.warnings && (decodeResult.warnings = context.warnings);
    context.shc && (decodeResult.shc = context.shc);
    context.compact && (decodeResult.compact = context.compact);
    context.flat && (decodeResult.flat = context.flat);
    context.jws && (decodeResult.jws = context.jws);
    context.fhirbundle && (decodeResult.fhir = context.fhirbundle);
    context.fhirbundle && (decodeResult.immunizations = fhir.getImmunizationRecord(context));

    return decodeResult;

}


export default decode;
