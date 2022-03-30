import { low } from '../src/index.js';
import { ErrorCode } from "../src/error.js";
import { Base64Url, JWSHeader } from '../src/types.js';
import convert from '../src/convert.js';
import { checkErrors, toCorruptJson } from "./utils.js";
import header from '../src/jws.header.js';
import Context from '../src/context.js';
import {data} from './constants.js';


test('header-decode-valid', async () => {
    const context = new Context();
    context.flat.header = data.flat.header;
    low.decode.jws.header(context);
    header.validate(context);
    checkErrors(context);
});

test('header-decode-not-base64url', async () => {
    const context = new Context();
    context.flat.header = `${data.flat.header}+`;
    low.decode.jws.header(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('header-decode-base64url-single-char', async () => {
    const context = new Context();
    context.flat.header = `A`;
    low.decode.jws.header(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('header-decode-undefined', async () => {
    const context = new Context();
    context.flat.header = undefined as unknown as Base64Url;
    low.decode.jws.header(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('header-decode-null', async () => {
    const context = new Context();
    context.flat.header = null as unknown as Base64Url;
    low.decode.jws.header(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('header-decode-empty-string', async () => {
    const context = new Context();
    context.flat.header = '';
    low.decode.jws.header(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});


test('header-decode-as-number', async () => {
    const context = new Context();
    context.flat.header = 0 as unknown as string;
    low.decode.jws.header(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('header-decode-bad-json', async () => {
    const context = new Context();
    context.flat.header = data.flat.header;
    low.decode.jws.header(context);
    context.flat.header = convert.textToBase64(toCorruptJson(context.jws.header as JWSHeader), true);
    low.decode.jws.header(context);
    checkErrors(context, ErrorCode.JWS_HEADER_DECODE_FAIL);
});
