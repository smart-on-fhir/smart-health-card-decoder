import { ErrorCode } from "../src/error.js";
import { checkErrors } from "./utils.js";
import jws_compact from '../src/jws.compact.js';
import jws_flat from '../src/jws.flat.js';
import shc_decoder from '../src/shc.js';
import Context from '../src/context.js';
import { JWSCompact } from '../src/types.js';
import {data} from './constants.js';


/**
 * 
 * Decode
 * 
 */
test('jws-compact-decode', async () => {
    const context = new Context();
    context.compact = data.compact;
    jws_compact.decode(context);
    jws_flat.validate(context);
    checkErrors(context);
});


/**
 * 
 * Bad paramerters
 * 
 */
test('jws-compact-decode-null', async () => {
    const context = new Context();
    context.compact = null as unknown as JWSCompact;
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('jws-compact-decode-undefined', async () => {
    const context = new Context();
    context.compact = undefined as unknown as JWSCompact;
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('jws-compact-decodec-number-0', async () => {
    const context = new Context();
    context.compact = 0 as unknown as JWSCompact;
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('jws-compact-decode-number-1', async () => {
    const context = new Context();
    context.compact = 1 as unknown as JWSCompact;
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('jws-compact-decode-object', async () => {
    const context = new Context();
    context.compact = {} as unknown as JWSCompact;
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('jws-compact-decode-boolean', async () => {
    const context = new Context();
    context.compact = true as unknown as JWSCompact;
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('jws-compact-decode-string-empty', async () => {
    const context = new Context();
    context.compact = '';
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.JWS_COMPACT_FORMAT_ERROR);
});

test('jws-compact-decode-odd-numeric', async () => {
    const context = new Context();
    context.compact = 'shc:/12345';
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.JWS_COMPACT_FORMAT_ERROR);
});


/**
 * 
 * Validate
 * 
 */
test('jws-compact-validate', async () => {
    const context = new Context();
    context.compact = data.compact;
    jws_compact.validate(context);
    checkErrors(context);
});


/**
 * 
 * Encode
 * 
 */
test('jws-compact-encode-to-shc', async () => {
    const context = new Context();
    context.shc = data.shc;
    await shc_decoder.decode(context);
    jws_compact.encode(context);
    checkErrors(context);
    expect(context.shc).toEqual(data.shc);
});
