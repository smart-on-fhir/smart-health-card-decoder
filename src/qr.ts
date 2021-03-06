import Context from "./context.js";
import { Decoder } from '@nuintun/qrcode';
import { ErrorCode } from "./error.js";
import shc_decoder from './shc.js';

const LABEL = 'QR';

async function decode(context: Context): Promise<Context> {

    const log = context.log(LABEL);
    const decoder = new Decoder();

    if (typeof context.qr !== 'string') {
        return context;
    }

    const decoded = (await decoder.scan(context.qr));

    if (typeof decoded.data !== 'string') {
        return Promise.resolve(log.fatal(`Could not decode QR code.`, ErrorCode.QR_DECODE_ERROR));
    }

    context.shc = decoded.data ?? '';

    // http://github.com/soldair/node-qrcode 'qrcode' only creates qr codes.
    // jsqr only reads qrcodes from binary+height+width
    // https://github.com/nuintun/qrcode 'qrcode' is an encoder/decode that does handle data:image/png;base64, url, but it does not work in Node as it relies on HtmlImage

    if (context?.options?.chain !== false) await shc_decoder.decode(context);

    return context;
}

function validate(context: Context): Context {
    const log = context.log(LABEL);
    return context;
}

export default { decode, validate };
