// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import signature from '../src/signature.js';
import Context from '../src/context.js';
import shc from '../src/shc.js';
import { ErrorCode } from '../src/log.js';
import { checkErrors } from "./utils.js";
import utils from '../src/utils.js';
import { Directory, Issuer, IssuerInfo, JWK, JWSHeader, JWSPayload, Options } from '../src/types.js';
import {data} from './constants.js';
import payload from '../src/jws.payload';


const EC = ErrorCode;

let decoded: Context;

beforeAll(async () => {
    const context = new Context();
    context.shc = data.shc;
    decoded = await shc.decode(context);
});

function cloneContext(options?: Options): Context {
    const clone = new Context();
    clone.jws.header = utils.clone<JWSHeader>(decoded.jws.header as JWSHeader);
    clone.jws.payload = utils.clone<JWSPayload>(decoded.jws.payload as JWSPayload);
    clone.jws.signature = decoded.jws.signature?.slice(0);
    clone.compact = decoded.compact;
    options && (clone.options = options);
    return clone;
}

test('signature-verify-valid', async () => {
    const context = cloneContext({ directory: utils.clone<Directory>(data.directory) });
    await signature.verify(context);
    checkErrors(context);
});

test('signature-verify-wrong-signature', async () => {
    const context = cloneContext({ directory: utils.clone<Directory>(data.directory) });
    (context.jws.signature as Uint8Array)[4] = ((context.jws.signature as Uint8Array)[4] + 1 % 256);
    await signature.verify(context);
    checkErrors(context, EC.SIGNATURE_INVALID);
});

test('signature-verify-cjws-altered', async () => {
    const context = cloneContext({ directory: utils.clone<Directory>(data.directory) });
    (context.compact as string) = (context.compact as string).replace('.', 'A.');
    await signature.verify(context);
    checkErrors(context, EC.SIGNATURE_INVALID);
});

test('signature-verify-issuerInfo-empty', async () => {
    const directory = utils.clone<Directory>(data.directory);
    const context = cloneContext({directory});
    directory.issuerInfo = [];
    await signature.verify(context);
    checkErrors(context, EC.DIRECTORY_ISSUER_NOT_FOUND);
});

test('signature-verify-issuerInfo-undfined', async () => {
    const directory = utils.clone<Directory>(data.directory);
    const context = cloneContext({directory});
    directory.issuerInfo = undefined as unknown as IssuerInfo[];
    await signature.verify(context);
    checkErrors(context, EC.DIRECTORY_SCHEMA_ERROR);
});

test('signature-verify-cannot-find-iss', async () => {
    const directory = utils.clone<Directory>(data.directory);
    const context = cloneContext({directory});
    directory.issuerInfo[0].issuer.iss = 'foo';
    await signature.verify(context);
    checkErrors(context, EC.DIRECTORY_ISSUER_NOT_FOUND);
});

test('signature-verify-cannot-find-kid', async () => {
    const directory = utils.clone<Directory>(data.directory);
    const context = cloneContext({directory});
    directory.issuerInfo[0].keys[0].kid = 'foo';
    await signature.verify(context);
    checkErrors(context, EC.DIRECTORY_KEY_NOT_FOUND);
});

test('signature-verify-issuer-name-missing', async () => {
    const directory = utils.clone<Directory>(data.directory);
    const context = cloneContext({directory});
    delete (directory.issuerInfo[0].issuer as Partial<Issuer>).name;
    await signature.verify(context);
    checkErrors(context);
});

test('signature-verify-bad-key-kty', async () => {
    const directory = utils.clone<Directory>(data.directory);
    const context = cloneContext({directory});
    directory.issuerInfo[0].keys[0].kty = 'foo';
    await signature.verify(context);
    checkErrors(context, [[EC.SIGNATURE_INVALID], [EC.JWK_INVALID_PROPERTY]]);
});

test('signature-verify-bad-key-alg', async () => {
    const directory = utils.clone<Directory>(data.directory);
    const context = cloneContext({directory});
    directory.issuerInfo[0].keys[0].alg = 'foo';
    await signature.verify(context);
    checkErrors(context, [[EC.SIGNATURE_INVALID], [EC.JWK_INVALID_PROPERTY]]);
});


// with keys[] and no directory

test('signature-verify-valid-with-keys', async () => {
    const context = cloneContext({ keys: utils.clone<JWK[]>(data.directory.issuerInfo[0].keys) });
    await signature.verify(context);
    checkErrors(context, [[],[ErrorCode.KEYS_ONLY_MATCH]]);
});

test('signature-verify-valid-with-non-matching-keys', async () => {
    const context = cloneContext({ keys: utils.clone<JWK[]>(data.directory.issuerInfo[0].keys) });
    const key = context.options?.keys?.[0] as JWK;
    key.kid = key.x;
    await signature.verify(context);
    checkErrors(context, ErrorCode.DIRECTORY_KEY_NOT_FOUND);
});


test('signature-sign-valid', async () => {
    const pubKey = {...data.privateKey};
    delete (pubKey as Partial<JWK>).d;
    const context = new Context({ privateKey: data.privateKey, keys: [pubKey] });
    
    // get a payload object
    context.flat.payload = data.flat.payload;
    payload.decode(context);

    // sign
    await signature.sign(context);
    checkErrors(context);

    // verify
    await signature.verify(context);
    checkErrors(context, [[],[ErrorCode.KEYS_ONLY_MATCH]]);
});