import { low } from '../src/index';
import { ErrorCode } from "../src/error";
import { checkErrors, toCorruptJson } from "./utils.js";
import signature from '../src/jws.signature';
import { Base64Url } from '../src/types';
import Context from '../src/context';
import convert from '../src/convert';

const validSignature = 'XuJ0cGQ88PmT5drNtymbZiAA7VBQIKSG2jZbljdx8Gram3gNKXjy0jsADh8uDoPKdck90_EK9k6GKNLKmO8ygA';

test('signature-decode-valid', async () => {
    const context = new Context();
    context.flat.signature = validSignature;
    low.decode.jws.signature(context);
    signature.validate(context);
    checkErrors(context);
});

test('signature-decode-not-base64url', async () => {
    const context = new Context();
    context.flat.signature = `${validSignature}+`;
    low.decode.jws.signature(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('signature-decode-base64url-single-char', async () => {
    const context = new Context();
    context.flat.signature = `A`;
    low.decode.jws.signature(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('signature-decode-undefined', async () => {
    const context = new Context();
    context.flat.signature = undefined as unknown as Base64Url;
    low.decode.jws.signature(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('signature-decode-null', async () => {
    const context = new Context();
    context.flat.signature = null as unknown as Base64Url;
    low.decode.jws.signature(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('signature-decode-empty-string', async () => {
    const context = new Context();
    context.flat.signature = '';
    low.decode.jws.signature(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});


test('signature-decode-as-number', async () => {
    const context = new Context();
    context.flat.signature = 0 as unknown as string;
    low.decode.jws.signature(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});
