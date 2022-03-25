// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Context from "./context.js";
import { ErrorCode } from "./error.js";
import { LogLevel } from "./log.js";
import { Issuer, Base64Url, JWK, Directory, IssuerInfo } from "./types.js";
import utils from "./utils.js";
import axios from "axios";
import download from "./download.js";
import key from "./key.js";

const defaultDirectoryUrl = 'https://raw.githubusercontent.com/the-commons-project/vci-directory/main/logs/vci_snapshot.json';


let _axios = axios.create({
    timeout: 5000
});


async function validate(directory: any, context: Context): Promise<boolean> {

    const { log } = context;
    log.label = 'DIRECTORY';

    if (!utils.is.object(directory)) {
        log.fatal(`directory param is not an object`);
        return false;
    }

    if (!('directory' in directory) || typeof directory.directory !== 'string') {
        log.warn(`directory.directory is not a string`, ErrorCode.DIRECTORY_ERROR);
    }

    if (!('time' in directory) || typeof directory.time !== 'string') {
        log.warn(`directory.time is not a string`, ErrorCode.DIRECTORY_ERROR);
    } else if (isNaN(Date.parse(directory.time))) {
        log.warn(`directory.time not a valid DateTime string`, ErrorCode.DIRECTORY_ERROR);
    }

    if (!('issuerInfo' in directory) || !(directory.issuerInfo instanceof Array)) {
        log.fatal(`directory.issuerInfo is not an Issuer & JWK []`, ErrorCode.DIRECTORY_ERROR);
        return false;
    }

    const result = await validateIssuerInfo(directory.issuerInfo, context);

    return result;
}



async function validateIssuerInfo(issuerInfo: any, context: Context): Promise<boolean> {

    const { log } = context;
    const errorCount = context.log.entries().length;

    if (!(issuerInfo instanceof Array)) {
        log.fatal(`issuerInfo param is not an Array`);
        return Promise.resolve(false);
    }

    for (const ii of issuerInfo) {
        log.label = `DIRECTORY.${ii?.issuer?.name.replace(/ /g, '_')}`;
        validateIssuer(ii.issuer, context);
        await key.validate.keys(ii.keys, context);
    }

    return errorCount === context.log.entries().length;
}


function validateIssuer(issuer: any, context: Context): issuer is Issuer {

    const { log } = context;

    if (!utils.is.object(issuer)) {
        log.fatal(`issuer param is not an object`);
        return false;
    }

    if (!('iss' in issuer) || typeof issuer.iss !== 'string') {
        log.fatal(`issuer.iss is not a string`, ErrorCode.DIRECTORY_ISSUER_MISSING_ISS);
        return false;
    }

    if (!('name' in issuer) || typeof issuer.name !== 'string') {
        log.warn(`issuer.name is not a string`, ErrorCode.DIRECTORY_ISSUER_INVALID_PROPERTY);
    }

    if ('website' in issuer && typeof issuer.website !== 'string') {
        log.warn(`optional issuer.website is not a string`, ErrorCode.DIRECTORY_ISSUER_INVALID_PROPERTY);
    }

    if ('canonical_iss' in issuer && typeof issuer.canonical_iss !== 'string') {
        log.warn(`optional issuer.canonical_iss is not a string`, ErrorCode.DIRECTORY_ISSUER_INVALID_PROPERTY);
    }

    return context.log.entries(LogLevel.ERROR).length === 0;

}


function lookupKey(iss: string, kid: Base64Url, context: Context): { issuer: Issuer, key: JWK } | undefined {

    const { log } = context;
    log.label = "DIRECTORY";

    const directory = context.options.directory;
    const keys = context.options.keys;

    if (!directory && !keys) {
        log.fatal(`options.directory or options.keys not set`, ErrorCode.DIRECTORY_MISSING);
        return;
    }

    if (directory) {

        const issuerInfo = directory.issuerInfo;

        if (!issuerInfo || !(issuerInfo instanceof Array)) {
            log.fatal(`directory.issuerInfo is not an Issuer & JWK []`, ErrorCode.DIRECTORY_SCHEMA_ERROR);
            return;
        }

        const info = issuerInfo.find(info => info.issuer?.iss === iss);

        if (!info) {
            log.fatal(`No issuer with .iss ${iss} found in directory`, ErrorCode.DIRECTORY_ISSUER_NOT_FOUND);
            return;
        }

        const key = info.keys.find(key => key?.kid === kid);

        if (!key) {
            log.fatal(`No key with .kid ${kid} found in issuer ${info.issuer?.name ?? iss}`, ErrorCode.DIRECTORY_KEY_NOT_FOUND);
            return;
        }

        return { issuer: info.issuer, key };
    }

    // if only keys provided
    const key = (keys as JWK[]).find(key => key?.kid === kid);

    if (!key) {
        log.fatal(`No key with .kid ${kid} found in options.keys`, ErrorCode.DIRECTORY_KEY_NOT_FOUND);
        return;
    }

    context.log.warn(`Key with matching kid found. However, without a directory, an issuer cannot be matched to jwk.payload.iss`, ErrorCode.KEYS_ONLY_MATCH);

    return { issuer: { iss: 'unknown', name: 'unknown' }, key };
}


async function build(issuers: Issuer[], context: Context): Promise<Directory> {


    const directory: Directory = {
        directory: '',
        time: (new Date()).toUTCString(),
        issuerInfo: []
    };

    const chunks = 8;

    const issuerChunks = chunkArray<Issuer>(issuers, Math.ceil(issuers.length / chunks));

    const P = [];

    for (const chunk of issuerChunks) {
        P.push(getKeys(chunk, context));
    }

    return Promise.all(P)
        .then(results => {
            const flat = ([] as IssuerInfo[]).concat(...results) as IssuerInfo[];
            flat.forEach(result => directory.issuerInfo.push(result));
            return directory;
        });

}


function chunkArray<T>(array: Array<T>, size: number): Array<Array<T>> {
    let result = []
    for (let i = 0; i < array.length; i += size) {
        let chunk = array.slice(i, i + size)
        result.push(chunk)
    }
    return result
}


async function getKeys(issuers: Issuer[], context: Context): Promise<IssuerInfo[]> {

    const issuerInfo: IssuerInfo[] = [];

    for (const issuer of issuers) {

        const keys = await downloadIssuerKeys(issuer.iss).catch((err) => {
            context.log.warn(`Failed to download ${issuer.iss} : ${err.message}`);
            return [];
        });

        issuerInfo.push({
            issuer: {
                iss: issuer.iss,
                name: issuer.name ?? ''
            },
            keys
        });

    }

    return issuerInfo;
}


function downloadIssuerKeys(url: string): Promise<JWK[]> {
    const jwkURL = `${url}/.well-known/jwks.json`;

    return _axios.get(jwkURL)
        .then(response => {
            return response.data.keys as JWK[];
        })
        .catch(error => {
            throw error;
        });

}


async function downloadDirectory(context: Context, url: string = defaultDirectoryUrl): Promise<Directory | undefined> {
    return await download<Directory>(url, context);
}


export default { validate, lookupKey, build, download: downloadDirectory };
