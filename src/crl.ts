import Context from "./context";
import { download as downloadUrl } from "./download";
import { ErrorCode } from "./error";
import { CRL, JWK } from "./types";
import { is } from "./utils";
import { validate as validateRid } from "./rid.js";
import { parse } from "./rid.js";


const LABEL = 'CRL';


export function validate(crls: CRL[], keys: JWK[], context: Context): boolean {

    const log = context.log(LABEL);
    const errorCount = context.errors?.length;

    if (!(crls instanceof Array)) {
        log.error(`crls is not an Array`, ErrorCode.CRL_INVALID_PROPERTY);
        return false;
    }

    const crlKids: string[] = [];

    for (const crl of crls) {
        const kidCtrKey = `${crl.kid}|${crl.ctr}`;
        if (context.options.validation?.directory?.allowDuplicates !== true && crlKids.includes(kidCtrKey)) {
            log.error(`duplicate crl entries with the same kid=${crl.kid} and ctr=${crl.ctr}`, ErrorCode.CRL_DUPLICATE_ENTRIES);
        }
        crlKids.push(kidCtrKey);
        validateSingle(crl, keys, context);
    }

    return errorCount !== context.errors?.length;
}


function validateSingle(crl: CRL, keys: JWK[], context: Context): boolean {

    const log = context.log(LABEL);
    const errorCount = context.errors?.length;

    if (!is.base64url(crl.kid)) {
        log.error(`CRL.kid is not base64url`, ErrorCode.CRL_INVALID_PROPERTY);
    }

    if (!keys.find(key => key.kid === crl.kid)) {
        log.warn(`CRL.kid: ${crl.kid} does not match any kid in the .keys set [${keys.map(key => key.kid).join(',')}]`, ErrorCode.CRL_NO_MATCHING_KEYS_KID);
    }

    if (crl.method !== "rid") {
        log.warn(`CRL.method: ${crl.method}, should be 'rid'`, ErrorCode.CRL_INVALID_PROPERTY);
    }

    if (!Number.isInteger(crl.ctr) || crl.ctr <= 0) {
        log.error(`CRL.ctr must be a positive integer greater than 0 (ctr === ${crl.ctr.toString()})`, ErrorCode.CRL_INVALID_PROPERTY);
    }

    if (!(crl.rids instanceof Array)) {
        log.error(`CRL.rids must be an array`, ErrorCode.CRL_INVALID_PROPERTY);
        return false;
    }

    if (context.options.validation?.directory?.allowDuplicates !== true) {
        const ridsWithoutTimestamps: string[] = crl.rids.map(rid => rid.split('.')[0]);
        crl.rids.forEach((rid, i) => {
            const [r] = rid.split('.');
            if (ridsWithoutTimestamps.includes(r, i + 1)) log.error(`Duplicate rid '${r}' in CRL with kid '${crl.kid}'`, ErrorCode.CRL_RID_DUPLICATE);
        });
    }

    crl.rids.forEach((rid, i) => {
        validateRid(rid, context);
    });

    const expectedProps = `kid method ctr rids`.split(' ');
    Object.keys(crl)
        .filter(prop => !expectedProps.includes(prop))
        .forEach(prop => log.warn(`Unexpected property '${prop}' in CRL.`, ErrorCode.CRL_INVALID_PROPERTY));

    return errorCount !== context.errors?.length;
}


export function verify(crl: CRL, key: JWK, context: Context): boolean {

    const log = context.log(LABEL);

    let validated = validate([crl], [key], context);

    if (crl.kid !== key.kid) {
        log.error(`CRL.kid doesn't match the key.crlVerson: crl.kid = ${crl.kid}, key.crlVerson = ${key.kid}`, ErrorCode.CRL_NO_MATCHING_KEYS_KID);
        validated = false;
    }

    if (crl.ctr !== key.crlVersion) {
        log.error(`CRL.ctr doesn't match the key.crlVerson: crl.kid = ${crl.kid}, key.crlVerson = ${key.kid}`, ErrorCode.CRL_INVALID_PROPERTY);
        validated = false;
    }

    return validated;
}


export async function download(issuerURL: string, kid: string, context: Context): Promise<string | undefined> {
    const log = context.log();
    const crlUrl = `${issuerURL}/.well-known/crl/${kid}.json`;

    log.info(`Retrieving CRL key from ${crlUrl}`);

    const crl = await downloadUrl<string>(crlUrl).catch(err => {
        log.error(`Error retrieving the CRL at ${crlUrl}: ` + (err as Error).toString(), ErrorCode.REVOCATION_ERROR);
        return undefined;
    });

    return crl;
}


export function find(rid: string, crl: CRL): { rid: string, seconds: number, crlVersion: number }[] {
    if (!is.array(crl.rids)) return [];
    return crl.rids.filter(r => r.split('.')[0] === rid).map(r => ({ ...parse(r) as { rid: string, seconds: number }, crlVersion: crl.ctr }))

}
