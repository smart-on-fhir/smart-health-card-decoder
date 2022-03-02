import { Artifact } from "./log";
import ValidationContext from "./context";
import { ErrorCode } from "./error";
import QRCode, { QRCodeSegment } from 'qrcode';
import jws_validator from './jws';

const shcPatternWithWhitspace = /^\s*shc:\/(\d\d)+\s*$/;
const shcPattern = /shc:\/((\d\d)+)/;


async function validate(shc: string, context: ValidationContext): Promise<ValidationContext> {

    const {log} = context;
    log.artifact = Artifact.SHC;


    return context;
}


async function decode(shc: string, context: ValidationContext): Promise<ValidationContext> {

    const log = context.log;
    log.artifact = Artifact.SHC;

    if (typeof shc !== 'string') {
        log.fatal(`shc parameter not a string`, ErrorCode.SHC_DECODE_ERROR);
        return context;
    }

    if (!shcPatternWithWhitspace.test(shc)) {
        log.fatal(`Invalid SHC format. Expect shc:/([0-9][0-9])+`, ErrorCode.SHC_DECODE_ERROR);
        return context;
    };

    context.shc = shc;

    // generate a QR code as a url if we don't already have a QR code.
    // this is a conveiniece for the caller.
    context.qr = context.qr || await generateQRUrlFromSch(shc);

    log.debug(`QR:\n${await generateQRTextFromSch(shc)}`);

    const digitString = shcPattern.exec(shc)?.[1] ?? '';
    const digitPairs = digitString.match(/(\d\d?)/g) ?? [];
    const b64Offset = '-'.charCodeAt(0);

    const compactjws: string = digitPairs
        .map((c: string) => String.fromCharCode(Number.parseInt(c) + b64Offset))
        .join('');

    context[`jwscompact`] = compactjws;

    jws_validator.decode(compactjws, context);

    return context;
}



async function generateQRUrlFromSch(shc: string): Promise<string> {

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

export default { validate, decode };
