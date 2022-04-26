import signature from '../src/signature.js';
import Context from '../src/context.js';
import shc from '../src/shc.js';
import { ErrorCode } from '../src/log.js';
import { checkErrors } from "./utils.js";
import { clone } from '../src/utils.js';
import { IDirectory, Issuer, IssuerInfo, JWK, JWSHeader, JWSPayload, Options } from '../src/types.js';
import { data } from './constants.js';
import payload from '../src/jws.payload';
import { Directory } from '../src/directory.js';


const EC = ErrorCode;

let decoded: Context;

beforeAll(async () => {
    const context = new Context();
    context.shc = data.shc;
    decoded = await shc.decode(context);
});


async function modifyDirectory( iDirectory: IDirectory, modify: (iDirectory: IDirectory) => void) :  Promise<Directory> {
    const cloned = clone<IDirectory>(iDirectory);
    modify(cloned);
    return Directory.create(cloned);
}

async function cloneContext(directory?: Directory): Promise<Context> {
    const ctx = new Context();
    ctx.jws.header = clone<JWSHeader>(decoded.jws.header as JWSHeader);
    ctx.jws.payload = clone<JWSPayload>(decoded.jws.payload as JWSPayload);
    ctx.jws.signature = decoded.jws.signature?.slice(0);
    ctx.compact = decoded.compact;
    ctx.directory = directory || await Directory.create(data.directory);
    //options && (ctx.options = options);
    return ctx;
}

test('signature-verify-valid-0', async () => {
    const context = await cloneContext();
    await signature.verify(context);
    checkErrors(context);
});

test('signature-verify-wrong-signature', async () => {
    const context = await cloneContext();
    (context.jws.signature as Uint8Array)[4] = ((context.jws.signature as Uint8Array)[4] + 1 % 256);
    await signature.verify(context);
    checkErrors(context, EC.SIGNATURE_INVALID);
});

test('signature-verify-cjws-altered', async () => {
    const context = await cloneContext();
    (context.compact as string) = (context.compact as string).replace('.', 'A.');
    await signature.verify(context);
    checkErrors(context, EC.SIGNATURE_INVALID);
});



test('signature-verify-cannot-find-iss', async () => {
    const directory = await modifyDirectory(data.directory, (dir) => {
        dir.issuerInfo[0].issuer.iss = 'foo';
    });
    const context = await cloneContext(directory);
    await signature.verify(context);
    checkErrors(context, EC.DIRECTORY_ISSUER_NOT_FOUND);
});

test('signature-verify-issuer-name-missing', async () => {
    const directory = await modifyDirectory(data.directory, (dir) => {
        delete (dir.issuerInfo[0].issuer as Partial<Issuer>).name;
    });
    const context = await cloneContext(directory);
        await signature.verify(context);
    checkErrors(context);
});
