import vciDirectory from "./vci_snapshot.json";
import directory from '../src/directory.js'
import Context from '../src/context.js';
import { ErrorCode } from '../src/log.js';
import { checkErrors } from "./utils.js";
import { Directory, Issuer, IssuerInfo, JWK } from '../src/types';


function cloneDirectory(dir: Directory): Directory {
    return JSON.parse(JSON.stringify(dir));
}

const EC = ErrorCode;

test('directory-validate-valid', async () => {
    const context = new Context();
    // TODO: had to truncate the vci snapshot to hide all the errors
    const dir = cloneDirectory(vciDirectory);
    const result = await directory.validate(dir, context);
    expect(result).toBe(true);
    checkErrors(context);
});

test('directory-validate-valid-no-issuers', async () => {
    const context = new Context()
    const dir = cloneDirectory(vciDirectory);
    dir.issuerInfo.length = 0;
    const result = await directory.validate(dir, context);
    expect(result).toBe(true);
    checkErrors(context);
});

test('directory-validate-no-directory', async () => {
    const context = new Context()
    const dir = cloneDirectory(vciDirectory);
    dir.issuerInfo.length = 1;
    delete (dir as Partial<Directory>).directory;
    await directory.validate(dir, context);
    checkErrors(context, [[], [EC.DIRECTORY_ERROR]]);
});

test('directory-validate-no-time', async () => {
    const context = new Context()
    const dir = cloneDirectory(vciDirectory);
    dir.issuerInfo.length = 1;
    delete (dir as Partial<Directory>).time;
    await directory.validate(dir, context);
    checkErrors(context, [[], [EC.DIRECTORY_ERROR]]);
});

test('directory-validate-time-invalid', async () => {
    const context = new Context()
    const dir = cloneDirectory(vciDirectory);
    dir.issuerInfo.length = 1;
    dir.time = "Not a time";
    await directory.validate(dir, context);
    checkErrors(context, [[], [EC.DIRECTORY_ERROR]]);
});

test('directory-validate-no-issuerInfo', async () => {
    const context = new Context()
    const dir = cloneDirectory(vciDirectory);
    delete (dir as Partial<Directory>).issuerInfo;
    await directory.validate(dir, context);
    checkErrors(context, EC.DIRECTORY_ERROR);
});

test('directory-validate-issuerInfo-undefined', async () => {
    const context = new Context()
    const dir = cloneDirectory(vciDirectory);
    dir.issuerInfo = undefined as unknown as IssuerInfo[];
    await directory.validate(dir, context);
    checkErrors(context, EC.DIRECTORY_ERROR);
});

test('directory-validate-issuer-missing-iss', async () => {
    const context = new Context();
    const dir = cloneDirectory(vciDirectory);
    dir.issuerInfo.length = 1;
    delete (dir.issuerInfo[0].issuer as Partial<Issuer>).iss
    await directory.validate(dir, context);
    checkErrors(context, EC.DIRECTORY_ISSUER_MISSING_ISS);
});

test('directory-validate-empty-key', async () => {
    const context = new Context();
    const dir = cloneDirectory(vciDirectory);
    dir.issuerInfo.length = 1;
    dir.issuerInfo[0].keys = [{} as JWK];
    await directory.validate(dir, context);
    checkErrors(context, [
        [EC.JWK_INVALID_PROPERTY, EC.JWK_INVALID_PROPERTY, EC.JWK_INVALID_PROPERTY, EC.JWK_INCORRECT_KID],
        [EC.JWK_INVALID_PROPERTY, EC.JWK_INVALID_PROPERTY, EC.JWK_INVALID_PROPERTY, EC.JWK_INVALID_PROPERTY]
    ]);
});

test('directory-download-vci-daily', async () => {
    const context = new Context();
    const dir = await directory.download(context);
    await directory.validate(dir, context);
    expect(dir?.issuerInfo.length).toBeGreaterThan(500);
    checkErrors(context);
});
