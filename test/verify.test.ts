import card from '../src/card.js';
import { verify } from '../src/index.js';
import { clone } from '../src/utils.js';
import { data } from './constants.js';
import Context from '../src/context.js';
import { IDirectory, JWS } from '../src/types.js';
import { checkErrors, modifyAndSign } from './utils.js';
import shc from '../src/shc.js';
import { Directory } from '../src/directory.js';



interface result {
    verified: boolean,
    data: Context,
    reason: string
}


let jws: JWS;

// decode a valid jws that each test can modify/use
beforeAll(async () => {
    const context = new Context();
    context.shc = data.shc;
    await shc.decode(context);
    jws = context.jws;
});


test('verify-decode-jws-compact', async () => {
    const directory = await Directory.create(data.directory);
    expect(directory.errors).toBeUndefined();
    const result = await verify(data.compact, directory);
    expect(card(result.data)).toMatchObject(immunizationCard);
});

test('verify-decode-shc', async () => {
    const directory = await Directory.create(data.directory);
    expect(directory.errors).toBeUndefined();
    const result = await verify(data.shc, directory);
    expect(card(result.data)).toMatchObject(immunizationCard);
});

test('verify-decode-jws-compact-altered-signature', async () => {
    const directory = await Directory.create(data.directory);
    expect(directory.errors).toBeUndefined();
    const result = await verify(data.compact.replace('.cFW5', '.cFW4'), directory);
    expect(card(result.data)).toMatchObject({ ...immunizationCard, verified: false });
});

test('verify-revoked-rid-10-seconds-after-nbf', async () => {
    // compute an rid slightly newer than the nbf in the jws.payload
    const validJws = clone<JWS>(jws);
    const rid = `MKyCxh7p6uQ.${Math.floor(validJws.payload!.nbf) + 10}`;
    // update the rid in the directory with the new rid
    const dir: IDirectory = clone(data.directoryWithCrl);
    dir.issuerInfo[0].crls![0].rids![0] = rid;
    const directory = await Directory.create(dir);
    expect(directory.errors).toBeUndefined();
    // verify the verification fails because of revocation but the decoded artifacts are without error
    const result = await verify(data.shc, directory);
    expect(result.verified).toBe(false);
    expect(result.reason).toBe('revoked');
    checkErrors(result.data);
});

test('verify-revoked-rid-1-seconds-before-nbf', async () => {
    // compute an rid slightly newer than the nbf in the jws.payload
    const validJws = clone<JWS>(jws);
    const rid = `MKyCxh7p6uQ.${Math.floor(validJws.payload!.nbf) - 1}`;
    // update the rid in the directory with the new rid
    const dir: IDirectory = clone(data.directoryWithCrl);
    dir.issuerInfo[0].crls![0].rids![0] = rid;
    const directory = await Directory.create(dir);
    expect(directory.errors).toBeUndefined();
    // verify the verification succeeds
    const result = await verify(data.shc, directory);
    expect(result.verified).toBe(true);
    expect(result.reason).toBe('success');
    checkErrors(result.data);
});

test('verify-revoked-rid-equals-nbf', async () => {

    let rid: string = '';
    const context = await modifyAndSign(data.shc, data.privateKey, (ctx: Context) => {
        const nbf = Math.floor(ctx.jws.payload!.nbf);
        ctx.jws.payload!.nbf = nbf;
        rid = `MKyCxh7p6uQ.${nbf.toString()}`;
    });

    // directory with updated rid
    const dir: IDirectory = clone(data.directoryWithCrl);
    dir.issuerInfo[0].crls![0].rids![0] = rid;
    const directory = await Directory.create(dir);
    expect(directory.errors).toBeUndefined();

    // "Reject the Health Card if the calculated rid is contained in the CRL's rids array and (if a timestamp suffix is present) the Health Card’s nbf is value is before the timestamp."
    const result = await verify(context.shc!, directory);
    expect(result.verified).toBe(true);
    expect(result.reason).toBe('success');
    checkErrors(result.data);

});

test('verify-revoked-rid-without-timestamp', async () => {
    // directory with updated rid w/o timestamp
    const dir: IDirectory = clone(data.directoryWithCrl);
    dir.issuerInfo[0].crls![0].rids![0] = dir.issuerInfo[0].crls![0].rids![0].split('.')[0];
    const directory = await Directory.create(dir);
    expect(directory.errors).toBeUndefined();
    // should be revoked regardless of nbf
    const result = await verify(data.shc, directory);
    expect(result.verified).toBe(false);
    expect(result.reason).toBe('revoked');
    checkErrors(result.data);
});

const immunizationCard = {
    verified: true,

    patient: {
        name: "Anyperson, John B.",
        dob: new Date("1951-01-20T00:00:00.000Z")
    },

    immunizations: [
        {
            dose: 1,
            date: new Date("2021-01-01T00:00:00.000Z"),
            manufacturer: "Moderna US.",
            performer: "ABC General Hospital"
        },
        {
            dose: 2,
            date: new Date("2021-01-29T00:00:00.000Z"),
            manufacturer: "Moderna US.",
            performer: "ABC General Hospital"
        }
    ],

    issuer: "smarthealth.cards"
};


test('verify-example', async () => {
    // Basic usage

    const resultFromQrScanner = data.shc;

    const vciDirectory = await Directory.create('vci'); // download daily VCI directory snapshot by default.

    const result = await verify(resultFromQrScanner, vciDirectory);

    if (result.verified === false) {
        const failureReason = result.reason;  // 'failed-validation' | 'bad-signature' | 'expired' | 'revoked'
        const failureErrors = result.data.errors;
        // handle errors
    }

    const fhirBundle = result.data.fhirBundle;

    // do something with fhir data
});
