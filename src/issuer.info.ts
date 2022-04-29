import Context from "./context";
import { validate as validateCrls } from './crl.js';
import { ErrorCode } from "./error";
import { validate as validateIssuer } from './issuer.js';
import key from "./key";
import { parse } from "./rid";
import { CRL, Issuer, IssuerInfo, JWK } from "./types";
import { isoDateString } from "./utils";
import { download as downloadUrl } from "./download.js";


type parsedRid = { rid: string, seconds: number, full: string };


export async function validate(issuerInfos: IssuerInfo[], context: Context): Promise<boolean> {

    const log = context.log();
    const errorCount = context.errors?.length;

    if (!(issuerInfos instanceof Array)) {
        log.fatal(`issuerInfo param is not an Array`);
        return Promise.resolve(false);
    }

    for (const ii of issuerInfos) {
        await validateSingle(ii, context);
    }

    if (context.options.validation?.directory?.allowDuplicates !== true) {
        issuerInfos
            .map(e => e.issuer.iss) // map into a list of iss strings
            .filter((e, i, a) => (typeof e === 'string') && a.indexOf(e) !== i) // get the duplicates (when iss is string)
            .forEach(dup => log.error(`duplicate issuer iss ${dup}`, ErrorCode.DIRECTORY_ISSUER_DUPLICATE));
    }

    return errorCount === context.errors?.length;
}


async function validateSingle(issuerInfo: IssuerInfo, context: Context): Promise<boolean> {

    const log = context.log();
    const errorCount = context.errors?.length;

    validateIssuer(issuerInfo.issuer, context)

    const ISO_TIMESTAMP_REGEX = /^\d{4}-[0-1]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\dZ$/;

    if (typeof issuerInfo.lastRetrieved !== 'string' || !ISO_TIMESTAMP_REGEX.test(issuerInfo.lastRetrieved)) {
        log.error(`IssuerInfo.lastRetrieved is not a timestamp string (e.g. "2022-04-14T04:39:51Z")`, ErrorCode.PARAMETER_INVALID);
    }

    await key.validate.keys(issuerInfo.keys, context);

    // rewrite the error labels adding the iss so the error output can be traced
    if(context.errors?.length ?? 0 > (errorCount ?? 0) ) {
        for (let index = (errorCount ?? 0); index < (context.errors?.length ?? 0); index++) {
            context.errors![index].label = `KEY:${issuerInfo.issuer.iss}`;            
        }
    }

    if (issuerInfo.crls) {
        validateCrls(issuerInfo.crls, issuerInfo.keys, context);
    }

    return errorCount === context.errors?.length;
}


export function findIssuer(iss: string, issuerInfos: IssuerInfo[]): IssuerInfo[] {
    if (!(issuerInfos instanceof Array)) return [];
    return issuerInfos.filter(ii => ii.issuer?.iss === iss);
}


export function findCrl(kid: string, issuerInfos: IssuerInfo[]): CRL[] {
    return issuerInfos.map(ii => (ii.crls instanceof Array) ? ii.crls.filter(crl => crl.kid === kid) : []).flat();
}


export function findKeys(kid: string, issuerInfos: IssuerInfo[]): JWK[] {
    return issuerInfos.map(ii => (ii.keys instanceof Array) ? ii.keys.filter(key => key.kid === kid) : []).flat();
}


export function create(issuer: Issuer, keys: JWK[], crls: CRL[] = [], lastRetrieved: string = isoDateString()): IssuerInfo {

    const issuerInfo: IssuerInfo = {
        issuer,
        keys
    };

    if (crls.length) issuerInfo.crls = crls;

    issuerInfo.lastRetrieved = lastRetrieved;

    return issuerInfo;
}


export function merge(info1: IssuerInfo, info2: IssuerInfo): IssuerInfo {

    info1.issuer = {
        ...info1.issuer,
        ...info2.issuer
    };

    // merge the keys keeping the keys with unique kids and the highest crl version (if present)
    const keys: JWK[] = info1.keys.concat(info2.keys);

    // merge the crl lists keeping crls with unique kids and the highest ctr version
    const crls: CRL[] = (info1.crls ?? []).concat(info2.crls ?? []);

    info1.lastRetrieved = (info1.lastRetrieved ?? '') > (info2.lastRetrieved ?? '') ? info1.lastRetrieved : info2.lastRetrieved;
    info1.crls = crls;
    info1.keys = keys;

    return scrub(info1);
}


export function scrub(info: IssuerInfo): IssuerInfo {

    // merge the keys keeping the keys with unique kids and the highest crl version (if present)
    info.keys = info.keys.reduceRight(
        (uniqueKeys: JWK[], key: JWK): JWK[] => {
            const foundKey = uniqueKeys.find(k => k.kid === key.kid);
            if (!foundKey) {
                uniqueKeys.push(key);
            } else if ((key.crlVersion ?? 0) > (foundKey.crlVersion ?? 0)) {
                uniqueKeys[uniqueKeys.indexOf(foundKey)] = key;
            }
            return uniqueKeys;
        },
        [] as JWK[]);

    if (!info.crls) return info;

    // merge the crl lists keeping crls with unique kids and the highest ctr version
    info.crls = (info.crls ?? []).reduceRight(
        (uniqueCrls: CRL[], crl: CRL): CRL[] => {
            const foundCrl = uniqueCrls.find(k => k.kid === crl.kid);
            if (!foundCrl) {
                uniqueCrls.push(crl);
            } else if ((crl.ctr ?? 0) > (foundCrl.ctr ?? 0)) {
                uniqueCrls[uniqueCrls.indexOf(foundCrl)] = crl;
            } else if ((crl.ctr ?? 0) === (foundCrl.ctr ?? 0)) {

                // merge rid lists keeping the rids with greatest timestamp
                const rids: parsedRid[] = foundCrl.rids.concat(crl.rids).map(r => ({ ...parse(r), full: r })).reduceRight(

                    (uniqueRids: parsedRid[], rid: parsedRid): parsedRid[] => {
                        const foundRid = uniqueRids.find(r => r.rid === rid.rid);
                        if (!foundRid) {
                            uniqueRids.push(rid);
                        } else if ((rid.seconds ?? 0) > (foundRid.seconds ?? 0)) {
                            uniqueRids[uniqueRids.indexOf(foundRid)] = rid;
                        }
                        return uniqueRids;
                    },
                    [] as parsedRid[]);

                foundCrl.rids = rids.map(parsedRid => parsedRid.full);
            }

            return uniqueCrls;
        },
        [] as CRL[]);

    return info;
}


export async function download(iss: string, context: Context): Promise<IssuerInfo | undefined> {

    const log = context.log();
    const crls: CRL[] = [];

    const keysUrl = `${iss}/.well-known/jwks.json`;

    const keys: JWK[] = (await downloadUrl<{ keys: JWK[] }>(keysUrl).catch(err => {
        log.fatal(`Error downloading ${keysUrl} [${err.message}]`, ErrorCode.DOWNLOAD_FAILED);
        return { keys: [] };
    })).keys;

    for (const key of keys) {

        const crlUrl = `${iss}/.well-known/crl/${key.kid}.json`;

        const crl = await downloadUrl<CRL>(crlUrl).catch(err => {
            log.debug(`Could not download ${crlUrl} [${err.message}]`);
            return undefined;
        });

        if (crl) crls.push(crl);
    };

    return create({ iss, name: '' }, keys, crls, isoDateString());
}
