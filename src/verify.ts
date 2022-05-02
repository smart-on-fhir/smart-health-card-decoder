import Context from "./context.js";
import signature_verifier from "./signature.js";
import { Options, JWSCompact, QRUrl, ShcNumeric, JWSFlat, JWK } from "./types.js";
import { low } from "./index.js";
import artifactDecoder from './decode.js';
import { revoked } from './revocation.js';
import { Directory } from "./directory.js";
import { ErrorCode } from "./error.js";


/**
 * Decodes and validates an encoded __SMART Health Card__:
 * 
 * @param {string} code - encoded SMART Health Card in one of the following forms:
 * 
 *    _ShcNumeric_ (string) : `'shc:/5676290952432060346029243740...'`c
 * 
 *    _QRUrl_ (string) : `'data:image/png;base64,iVBORw0KGoAAAANS...'`
 * 
 *    _JWSCompact_ (string) : `'eyJ6aXAiOiJERUYiONiIsImtpZI6IjNLZ...'`
 * 
 * @param {object} options - Verify() requires the `{directory: ...}` or `{keys: ...}` options to be provided for signature verification.
 * 
 * @returns {object} Promise\<VerificationRecord\> - object containing immunization data extracted from the SMART Health Card
 * 
 * @example
 * 
 * ```
 * import {verify, directory} from 'smart';
 * const directory = directory.download(); // vci daily snapshot
 * const shc = 'shc:/567629095243206034602924374 ...';
 * const verificationRecord = await verify(shc, { directory });
 * 
 * ```
 * 
 * @async
 */
//export async function verify(code: QRUrl | ShcNumeric | JWSCompact | JWSFlat, directory: Directory , options: Options): Promise<{ verified: boolean, reason: string, data: Context }>
//export async function verify(code: QRUrl | ShcNumeric | JWSCompact | JWSFlat, keys: JWK[], options: Options): Promise<{ verified: boolean, reason: string, data: Context }>
export async function verify(code: QRUrl | ShcNumeric | JWSCompact | JWSFlat, directory: Directory, options: Options = {}): Promise<{ verified: boolean, reason: string, data: Context }> {

    const context = await artifactDecoder(code, options);
    context.directory = directory;

    const jws = context.jws;
    jws && low.validate.jws(context);

    if (!jws?.payload) {
        return { data: context, verified: false, reason: 'failed-validation' };
    }

    const reasons: string[] = [];

    await signature_verifier.verify(context);

    const isNotRevoked = !(await revoked(context));

    const isNotExpired = (Date.now() / 1000) < (context.jws.payload?.exp ?? Number.MAX_SAFE_INTEGER);

    const isSignatureVerified = context.signature?.verified === true;

    // filter out signature error(s) so that they don't also become validation errors
    const isValidated = !(context.errors ?? []).filter(logEntry => logEntry.code < ErrorCode.SIGNATURE_INVALID).length;

    isNotExpired || reasons.push('expired');
    isNotRevoked || reasons.push('revoked');
    isSignatureVerified || reasons.push('bad-signature');
    isValidated || reasons.push('failed-validation');

    return {
        verified: isNotRevoked && isNotExpired && isSignatureVerified && isValidated,
        reason: reasons.join('|') || 'success',
        data: context
    }
}
