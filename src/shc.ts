import Context from "./context.js";
import { ErrorCode } from "./error.js";
import QRCode, { QRCodeSegment } from 'qrcode';
import { Options, ShcNumeric } from "./types.js";
import cjws from "./jws.compact";

const label = 'SHC';

const shcPattern = /^shc:\/((\d\d)+)$/;


function validate(context: Context): Context {

    const { log } = context;
    log.label = 'SHC';
    const shc = context.shc;

    if (typeof shc !== 'string') {
        log.fatal(`shc parameter is not a string`, ErrorCode.PARAMETER_INVALID);
        return context;
    }

    if (!shcPattern.test(shc?.trim())) {
        log.fatal(`shc parameter is not SHC format. Expect shc:/([0-9][0-9])+`, ErrorCode.SHC_FORMAT_ERROR);
        return context;
    }

    return context;
}


async function decode(context: Context): Promise<Context> {

    const log = context.log;
    log.label = label;

    if (validate(context).log.isFatal) return context;

    const shc = context.shc as ShcNumeric;

    // generate a QR code (as a url) if we don't already have a QR code.
    // this is a conveiniece for the caller to display a QR code from a provided shc string
    context.qr = context.qr || await generateQRUrlFromSch(shc);

    log.debug(`QR:\n${await generateQRTextFromSch(shc)}`);

    const digitString = shcPattern.exec(shc)?.[1] ?? '';
    const digitPairs = digitString.match(/(\d\d?)/g) ?? [];
    const b64Offset = '-'.charCodeAt(0);

    const compactjws: string = digitPairs
        .map((c: string) => String.fromCharCode(Number.parseInt(c) + b64Offset))
        .join('');

    context.compact = compactjws;

    if (context?.options?.chain !== false) cjws.decode(context);

    return context;
}


// Note: this is async because the qr-code generator
async function encode(context: Context): Promise<Context> {

    const { log } = context;
    log.label = label;

    if (validate(context).log.isFatal) return context;

    context.qr = await generateQRUrlFromSch(context.shc as string);

    return context;
}


async function generateQRUrlFromSch(shc: ShcNumeric): Promise<string> {
    const segs: QRCodeSegment[] = [
        { data: 'shc:/', mode: 'byte' },
        { data: shc.split('/')[1], mode: 'numeric' }
    ];
    return QRCode.toDataURL(segs, { errorCorrectionLevel: 'L' });
}


async function generateQRTextFromSch(shc: string): Promise<string> {
    const segs: QRCodeSegment[] = [
        { data: 'shc:/', mode: 'byte' },
        { data: shc.split('/')[1], mode: 'numeric' }
    ];
    return QRCode.toString(segs, { errorCorrectionLevel: 'L', type: 'utf8' });
}


export default { encode, validate, decode };
