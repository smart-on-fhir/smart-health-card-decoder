import { low } from '../src/index.js';
import { ErrorCode } from "../src/error.js";
import { Base64Url, JWSPayload } from '../src/types.js';
import convert from '../src/convert.js';
import jws_payload from '../src/jws.payload.js';
import { checkErrors, toCorruptJson } from "./utils.js";
import Context from '../src/context.js';
import {data} from './constants.js';


test('payload-decode-valid', async () => {
    const context = new Context();
    context.flat.payload = data.flat.payload;
    low.decode.jws.payload(context);
    jws_payload.validate(context);
    checkErrors(context);
});

test('payload-decode-future-nbf', async () => {
    const context = new Context();
    context.flat.payload = data.flat.payload;
    low.decode.jws.payload(context);
    (context.jws.payload as JWSPayload).nbf = Date.now() + 1000 * 60 * 60 * 24; // +1 day
    jws_payload.validate(context);
    checkErrors(context, [ErrorCode.JWS_PAYLOAD_FUTURE_NBF]); 
});

test('payload-decode-valid-with-whitespace', async () => {
    const context = new Context();
    context.flat.payload = `\n   ${data.flat.payload} \t\r\n\f `;
    low.decode.jws.payload(context);
    jws_payload.validate(context);
    checkErrors(context);
});

test('payload-decode-base64url-single-char', async () => {
    const context = new Context();
    context.flat.payload = `A`;
    low.decode.jws.payload(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('payload-decode-undefined', async () => {
    const context = new Context();
    context.flat.payload = undefined as unknown as Base64Url;
    low.decode.jws.payload(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('payload-decode-null', async () => {
    const context = new Context();
    context.flat.payload = null as unknown as Base64Url;
    low.decode.jws.payload(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('payload-decode-string-empty', async () => {
    const context = new Context();
    context.flat.payload = '';
    low.decode.jws.payload(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('payload-decode-not-base64url', async () => {
    const context = new Context();
    context.flat.payload = `${data.flat.payload}+`;
    low.decode.jws.payload(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('payload-decode-as-number', async () => {
    const context = new Context();
    context.flat.payload = 0 as unknown as Base64Url;
    low.decode.jws.payload(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('payload-decode-bad-json', async () => {
    const context = new Context();
    context.flat.payload = data.flat.payload;
    low.decode.jws.payload(context);
    context.flat.payload = convert.textToBase64(toCorruptJson(context.jws.payload as JWSPayload), true);
    low.decode.jws.payload(context);
    checkErrors(context, ErrorCode.JWS_PAYLOAD_DECODE_ERROR);
});

test('payload-decode-bad-inflate', async () => {
    const notDeflatedBytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const base64url = convert.bytesToBase64(notDeflatedBytes, true);
    const context = new Context();
    context.flat.payload = base64url;
    low.decode.jws.payload(context);
    checkErrors(context, ErrorCode.JWS_PAYLOAD_DECODE_ERROR);
});

test('payload-decode-encode-round-trip', async () => {
    const context = new Context();
    context.flat.payload = data.flat.payload;
    low.decode.jws.payload(context);
    low.encode.jws.payload(context);
    checkErrors(context);
    expect(context.flat.payload).toEqual(data.flat.payload);
});
