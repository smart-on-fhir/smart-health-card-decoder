import { Decoder } from '@nuintun/qrcode'
//import Jimp from 'jimp/browser/lib/jimp'
import { Artifact } from './log';
import ValidationContext from './context';
import shc_validator from './shc';
import { ErrorCode } from './error';

/**
 * Validates a SMART Healthcard QR code from Buffer or Base64url string.
 *
 * @remarks
 * Validates a QR code from a Buffer or base64url
 *
 * @param base64url - Base64url string of QR code image data
 * @param buffer - The second input number
 * @param options - The second input number
 * @returns ValidationResult
 *
 * @public
 */
async function decode(url: string, context: ValidationContext): Promise<ValidationContext> {

    const log = context.log;
    log.artifact = Artifact.QR;

    const decoder = new Decoder();
    const decoded = await decoder.scan(url);
    const shc = decoded?.data;

    if (typeof shc !== 'string') {
        log.error(`Could not decode QR code.`, ErrorCode.QR_DECODE_ERROR, true);
        context.shc = decoded?.data;
        return Promise.resolve(context);
    }

    await shc_validator.decode(shc, context);

    context.shc = shc;
    return context;

}

// async function decode(data : {data: ArrayBuffer, height: number, width: number}, context: ValidationContext) : Promise<string>
// async function decode(url : string, context: ValidationContext) : Promise<string>
// async function decode(filePath : string, context: ValidationContext) : Promise<string>
// async function decode(image : string | {data: ArrayBuffer, height: number, width: number}, context: ValidationContext) : Promise<string> {


//     return Promise.resolve("");

// }

export default { decode };
