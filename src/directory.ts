import constants from "./constants.js";
import Context from "./context.js";
import { download as urlDownload } from "./download.js";
import { ErrorCode } from "./error.js";
import { create as createIssuerInfo, download as downloadIssuerInfo, merge as mergeIssuerInfo, scrub as iiScrub, validate as validateIssuerInfo } from './issuer.info.js';
import { Log, LogEntry, } from "./log.js";
import {  CRL, DirectoryOptions, IDirectory, Issuer, IssuerInfo, JWK, ResultWithErrors } from "./types.js";
import { clone, is, isoDateString } from "./utils.js";



type directoryUrl = string;
type issUrl = string;
type DirectoryInputs = directoryUrl | issUrl[] | IDirectory | IDirectory[] | Directory | Directory[] | JWK[];


const LABEL = 'DIRECTORY';
const undefDirectory = undefined as unknown as IDirectory;


async function validate(directory: any, context: Context): Promise<boolean> {

    const log = context.log(LABEL);

    if (!is.object(directory)) {
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

    let result = await validateIssuerInfo(directory.issuerInfo, context);

    return result;
}


async function download(url: string = constants.VCI_DIRECTORY_DAILY_SNAPSHOT_URL): Promise<IDirectory> {
    return await urlDownload<IDirectory>(url).catch(error => { throw error });
}


async function generate(issList: string[], id: string, context: Context): Promise<IDirectory>
async function generate(issList: Issuer[], id: string, context: Context): Promise<IDirectory>
async function generate(issList: string[] | Issuer[], id: string, context: Context): Promise<IDirectory> {

    const log = context.log();

    const directory: IDirectory = {
        directory: id,
        time: isoDateString(),
        issuerInfo: []
    };

    if (
        (issList as string[]).every(iss => typeof iss === 'string') === false ||
        (issList as Issuer[]).every(iss => !is.object(iss) || !('iss' in iss) || !('name' in iss)) === false
    ) {
        throw new Error(`list is not a string[] or Issuer[]`);
    }

    if (issList.length && typeof issList[0] === 'string') {
        issList = (issList as string[]).map(iss => { return { iss, name: iss } }) as Issuer[];
    }

    for (const issuer of issList as Issuer[]) {

        const crls: CRL[] = [];
        const keysUrl = `${issuer.iss}/.well-known/jwks.json`;

        const keySet = (await urlDownload<{ keys: JWK[] }>(keysUrl).catch(err => {
            log.fatal(`Error downloading ${keysUrl}`, ErrorCode.DOWNLOAD_FAILED);
            return undefined;
        }));

        if (!keySet) continue;

        for (const key of keySet.keys) {
            const crlUrl = `${issuer.iss}/.well-known/crl/${key.kid}.json`;
            const crl = await urlDownload<CRL>(crlUrl).catch(err => {
                log.debug(`Could not download ${crlUrl} [${err.message}]`);
                return undefined;
            });
            if (crl) crls.push(crl);
        };

        const issuerInfo = createIssuerInfo(issuer, keySet.keys, crls);

        directory.issuerInfo.push(issuerInfo);

    };

    scrub(directory);

    return directory;
}


function merge(directories: IDirectory[]): IDirectory {

    const directory = directories.length === 1 ? directories[0] : directories.map(dir => clone<IDirectory>(dir)).reduce((a, b) => {
        a.issuerInfo = a.issuerInfo.concat(b.issuerInfo);
        a.time = a.time > b.time ? a.time : b.time;
        a.directory = a.directory !== b.directory ? `${a.directory}|${b.directory}` : a.directory;
        a.time = a.time > b.time ? a.time : b.time;
        return a;
    });

    scrub(directory);

    return directory;
}


function scrub(directory: IDirectory): IDirectory {

    directory.issuerInfo = directory.issuerInfo.reduceRight(
        (uniqueIssuers: IssuerInfo[], issuerInfo: IssuerInfo) => {

            const foundIssuer = uniqueIssuers.find(ii => ii.issuer.iss === issuerInfo.issuer.iss);

            if (foundIssuer) {
                uniqueIssuers[uniqueIssuers.indexOf(foundIssuer)] = mergeIssuerInfo(foundIssuer, issuerInfo);
            } else {
                uniqueIssuers.push(iiScrub(issuerInfo));
            }

            return uniqueIssuers;
        },
        [] as IssuerInfo[]
    );

    return directory;
}


async function update(issuerInfo: IssuerInfo): Promise<ResultWithErrors<IssuerInfo>> {

    const context = new Context();

    const issuerInfoNew = await downloadIssuerInfo(issuerInfo.issuer.iss, context);

    if (!issuerInfoNew) {
        return { result: undefined, errors: context.errors };
    }

    return { result: mergeIssuerInfo(issuerInfoNew, issuerInfo) };
}


async function create(directory?: DirectoryInputs, options: DirectoryOptions = {}): Promise<[IDirectory, Context]> {

    const context = new Context({ validation: options });
    const log = context.log(LABEL);


    // if nothing passed in, return a minimal valid IDirectory
    if (directory == null || (directory instanceof Array && directory.length === 0)) {
        return [empty(), context];
    }

    // url to directory
    if ((directory === 'vci' || is.url(directory))) {
        context.options.validation = {
            ...context.options.validation,
            key: {
                // the vci daily snapshot allows 
                filterBadKeys: true,
                allowAdditionalProperties: true                
            }
        }
        return createFromUrl(directory, context);
    }

    // Directory object
    if (directory instanceof Directory) {
        directory = directory.export();
    }

    // IDirectory as object
    if (isIDirectory(directory)) {
        directory = [directory];
    }

    // array of Directory objects
    if (directory instanceof Array && (directory as Directory[]).every(element => element instanceof Directory)) {
        directory = (directory as Directory[]).map(dir => dir.export());
    }

    // array of IDirectory objects
    if (directory instanceof Array && (directory as IDirectory[]).every(element => isIDirectory(element))) {

        // disable the duplicates check as there could be some overlap in the directories and the merge 
        // function will fix the duplicates
        const saveOptions = context.options.validation;
        context.options.validation = { ...context.options.validation, directory: { allowDuplicates: true } };

        let validated = (await Promise.all((directory as IDirectory[]).map(dir => validate(dir, context)))).every(p => p);

        // restore the options
        saveOptions ? context.options.validation = saveOptions : delete context.options.validation;

        if (!validated) return [undefDirectory, context];

        const merged = merge(directory as IDirectory[])

        // When were confident merge doesn't create errors we can remove the two lines below ///////////////////////////

        // remove the errors from the context as we are about to validate again and don't want duplicate entries
        log.clear();

        // validate again to ensure the merged directory is valid
        validated = await validate(merged, context);

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        return [validated ? merged : undefDirectory, context];
    }

    // array of iss urls
    if (directory instanceof Array && (directory as string[]).every(element => is.url(element))) {

        const generated = await generate(directory as string[], 'Directory', context).catch(err => {
            return;
        });
        if (!generated) return [undefDirectory, context];

        // validate again to ensure the generated directory is valid
        if (!(await validate(generated, context))) return [undefDirectory, context];

        return [generated, context];
    }

    log.fatal(`parameter is not a valid value (url, Directory-object, Directory-object[], iss[])`, ErrorCode.PARAMETER_INVALID);

    return [undefDirectory, context];
}


async function createFromUrl(url: string, context: Context): Promise<[IDirectory, Context]> {

    const log = context.log(LABEL);

    if (url.toLocaleLowerCase() === 'vci') {
        url = constants.VCI_DIRECTORY_DAILY_SNAPSHOT_URL;
    }

    const downloaded = await download(url).catch(err => {
        log.debug(`Error downloading directory from url ${err.toString()}`);
        return undefined;
    });

    if (!downloaded) {
        log.fatal(`Could not download Directory from url ${url}`, ErrorCode.DOWNLOAD_FAILED);
        return [undefDirectory, context];
    }

    if ( (await validate(downloaded as IDirectory, context)) === false && context.options.validation?.directory?.ommitBadIssuers === false ) {
        return [undefDirectory, context];
    }

    return [downloaded as IDirectory, context];
}


function isIDirectory(directory: any): directory is IDirectory {
    return is.object(directory) && (directory as IDirectory).issuerInfo instanceof Array;
}


function empty(): IDirectory {
    return { directory: '', time: isoDateString(), issuerInfo: [] };
}


export class Directory {

    #name: string = '';
    #time: string = '';
    #issuerInfo: IssuerInfo[];
    #context: Context;

    constructor(directoryData: IDirectory, context?: Context) {
        this.#context = context || new Context();
        this.#issuerInfo = directoryData.issuerInfo;
        //Object.freeze(this.#issuerInfo);
        this.#name = directoryData.directory ?? '';
        this.#time = directoryData.time ?? isoDateString();
    }

    static async create(directoryData?: DirectoryInputs, options: DirectoryOptions = {}): Promise<Directory> {

        try {
            let [dir, context] = await create(directoryData as string | IDirectory | string[] | IDirectory[], options);
            return new Directory(dir || empty(), context);

        } catch (err) {
            const context = new Context();
            context.log().fatal(`Error creating Directory: ${(err as Error).toString()}`, ErrorCode.DIRECTORY_ERROR);
            return new Directory(empty(), context);
        }
    }

    get errors(): LogEntry[] | undefined {
        return this.#context.errors;
    }

    get warnings(): LogEntry[] | undefined {
        return this.#context.warnings;
    }

    get issuerInfo(): IssuerInfo[] {
        return this.#issuerInfo;
    }

    get name(): string {
        return this.#name;
    }

    set name(value: string) {
        if (typeof value !== 'string') return;
        this.#name = value;
    }

    get time(): string {
        return this.#time;
    }

    set time(value: string) {
        if (typeof value !== 'string' || !Number.isInteger(Date.parse(value))) return;
        this.#time = value;
    }

    get validated(): boolean {
        return !(this.#context.errors?.length);
    }

    public find(iss: string, kid?: string, rid?: string): IssuerInfo | undefined {

        const issuer = this.#issuerInfo.find(info => info.issuer.iss === iss);
        if (!issuer) return undefined;

        if (!kid) return issuer;

        const key = issuer.keys.find(key => key.kid === kid);
        if (!key) return undefined;

        let crlRid;
        let crl;
        if (rid) {
            // if no revocation lists, no rids
            if (!issuer.crls?.length) return undefined;

            crl = issuer.crls.find(crl => crl.kid === kid);
            if (!crl) return undefined;

            if (!crl.rids.length) return undefined;
            crlRid = crl.rids.find(crid => crid === rid);

            if (!crlRid) return undefined;
            crl.rids = [crlRid];
        }

        return createIssuerInfo(issuer.issuer, [key], crl ? [crl] : undefined, issuer.lastRetrieved);
    }

    public export(): IDirectory {
        return {
            directory: this.#name,
            time: this.#time,
            issuerInfo: clone(this.#issuerInfo)
        }
    }

    public async update(iss: string): Promise<boolean>
    public async update(date: Date | Date): Promise<boolean>
    public async update(issOrDate: string | Date): Promise<boolean> {

        let isss: string[];

        if (issOrDate instanceof Date) {
            isss = this.#issuerInfo.filter(ii => {
                return (new Date(ii.lastRetrieved as string) < issOrDate)
            }).map(ii => ii.issuer.iss);
        } else if (is.url(issOrDate)) {
            isss = [issOrDate];
        } else {
            throw new TypeError(`update parameter must be a url string or Date`);
        }

        for (const iss of isss) {

            const ii = this.find(iss);

            if (!ii) {
                return Promise.reject([Log.logEntry(`Cannot find iss ${iss} in directory`, ErrorCode.PARAMETER_INVALID)]);
            }

            const updatedIssuerInfo = await update(ii);

            if (updatedIssuerInfo.errors) {
                return false;
            }

            this.#issuerInfo[this.#issuerInfo.indexOf(ii)] = updatedIssuerInfo.result as IssuerInfo;
        };

        return true;
    }

}
