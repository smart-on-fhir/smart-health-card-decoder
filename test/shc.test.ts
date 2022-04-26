import { ErrorCode } from "../src/error.js";
import { checkErrors } from "./utils.js";
import shc from '../src/shc.js';
import Context from "../src/context.js";
import { QRUrl } from "../src/types.js";
import {data} from './constants.js';

/**
 * 
 * Bad paramerters
 * 
 */
test('shc-decode-null', async () => {
    const context = new Context();
    context.shc = null as unknown as string;
    shc.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('shc-decode-undefined', async () => {
    const context = new Context();
    context.shc = undefined as unknown as string;
    shc.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('shc-decodec-number-0', async () => {
    const context = new Context();
    context.shc = 0 as unknown as string;
    shc.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('shc-decode-number-1', async () => {
    const context = new Context();
    context.shc = 1 as unknown as string;
    shc.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('shc-decode-object', async () => {
    const context = new Context();
    context.shc = {} as unknown as string;
    shc.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('shc-decode-boolean', async () => {
    const context = new Context();
    context.shc = true as unknown as string;
    shc.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('shc-decode-string-empty', async () => {
    const context = new Context();
    context.shc = '' as unknown as string;
    shc.decode(context);
    checkErrors(context, ErrorCode.SHC_FORMAT_ERROR);
});

test('shc-decode-odd-numeric', async () => {
    const context = new Context();
    context.shc = 'shc:/1234567';
    shc.decode(context);
    checkErrors(context, ErrorCode.SHC_FORMAT_ERROR);
});




/**
 * 
 * Validate
 * 
 */
test('shc-validate', async () => {
    const context = new Context();
    context.shc = data.shc;
    shc.validate(context);
    checkErrors(context);
});

test('shc-validate-wrong', async () => {
    const context = new Context();
    context.shc = 'blah blah blah';
    shc.validate(context);
    checkErrors(context, ErrorCode.SHC_FORMAT_ERROR);
});




/**
 * 
 * Encode
 * 
 */
 test('shc-encode-to-qr-url', async () => {
    const context = new Context();
    context.shc = data.shc;
    await shc.encode(context);
    checkErrors(context);
    expect(/data:image\/png;base64,[0-9A-Za-z+\/]+={0,2}/.test(context.qr as QRUrl)).toEqual(true);
});
