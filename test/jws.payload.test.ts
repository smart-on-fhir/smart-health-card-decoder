import { low } from '../src/index.js';
import { ErrorCode } from "../src/error.js";
import { Base64Url, JWSPayload } from '../src/types.js';
import convert from '../src/convert.js';
import jws_payload from '../src/jws.payload.js';
import { checkErrors, toCorruptJson } from "./utils.js";
import Context from '../src/context.js';

const validpayload = '3ZLLbtswEEV_JZhuZb2c2LF2dQr0sSgKNO0m8IKmxhYLihT4EOIa-vfOMA6aBElWWYUrjThzee8hj6C8hwa6EAbfFIUfUOa-Fy50KHTocilc6wu8Ff2g0RfUHdFBBma7g6ZanC8uF_P55Txf1hcZjBKaI4TDgNDc_Nd8KvfhrphxQVIv96m-j0b9FUFZ82qjtKNqqxVsMpAOWzRBCf0zbv-gDGxp1yn3G51nnQbO8zKvSI__rqNpNdk9gkNvo5N4nezDaSM7xQFptSa1Oyd0gDtQRlKOWv9ymhru55uSGu6LZ4R_UByaZ4aiZ1AkInqlSQ8-GupxPp2xVyOS2xv4Zjuu1zlsJgq4VRT-kwisVa0uqllZzeoSpil71g0HfcXN18eIfRAh8oOQli88IF_QKKRUBq9smxSkbZXZJ-P-4AP2p_dDN9PpZW7dvmCyhVdtIcdbEqAJPqsulzBtpgyGE4JkZ4cODXt7SJCarJTRpS0Oe62YFUnUKXDJsQjVzrqe3iN7ETJY-jpCq_ygRcK5vjr7jAad0GdfrB9UEJpAEURtw_fYb3kUyrSqFwnW75JgvXprgmSNvNH6Bw';

test('payload-decode-valid', async () => {
    const context = new Context();
    context.flat.payload = validpayload;
    low.decode.jws.payload(context);
    jws_payload.validate(context);
    checkErrors(context);
});

test('payload-decode-valid-with-whitespace', async () => {
    const context = new Context();
    context.flat.payload = `\n   ${validpayload} \t\r\n\f `;
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
    context.flat.payload = `${validpayload}+`;
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
    context.flat.payload = validpayload;
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
    context.flat.payload = validpayload;
    low.decode.jws.payload(context);
    low.encode.jws.payload(context);
    checkErrors(context);
    expect(context.flat.payload).toEqual(validpayload);
});
