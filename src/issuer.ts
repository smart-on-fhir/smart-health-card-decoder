import Context from "./context";
import { ErrorCode } from "./error";
import { LogLevel } from "./log";
import { Issuer } from "./types";
import { is } from "./utils";

const LABEL = 'ISSUER';

export function validate(issuer: any, context: Context): issuer is Issuer {

    const log = context.log(LABEL);

    if (!is.object(issuer)) {
        log.fatal(`issuer param is not an object`);
        return false;
    }

    if (!('iss' in issuer) || typeof issuer.iss !== 'string') {
        log.fatal(`issuer.iss is not a string`, ErrorCode.DIRECTORY_ISSUER_MISSING_ISS);
        return false;
    }

    try {
        new URL(issuer.iss);
    } catch(err) {
        log.fatal(`issuer.iss (${issuer.iss}) is not a valid url`, ErrorCode.PARAMETER_INVALID);
        return false;
    }

    if (!('name' in issuer) || typeof issuer.name !== 'string') {
        log.warn(`issuer.name is not a string`, ErrorCode.DIRECTORY_ISSUER_INVALID_PROPERTY);
    }

    if ('website' in issuer && typeof issuer.website !== 'string') {
        log.warn(`issuer.website (optional) is not a string`, ErrorCode.DIRECTORY_ISSUER_INVALID_PROPERTY);
    }

    if ('canonical_iss' in issuer && typeof issuer.canonical_iss !== 'string') {
        log.warn(`issuer.canonical_iss (optional) is not a string`, ErrorCode.DIRECTORY_ISSUER_INVALID_PROPERTY);
    }

    return log.entries(LogLevel.ERROR).length === 0;

}