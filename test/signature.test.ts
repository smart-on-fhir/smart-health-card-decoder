import validator from '../src/index';
import signature from '../src/signature';
import Context from '../src/context';
import shc from '../src/shc';
import { ErrorCode } from '../src/log';
import { checkErrors } from "./utils.js";
import utils from '../src/utils';
import { Directory, Issuer, IssuerInfo, JWK, JWSHeader, JWSPayload, Options } from '../src/types';


const EC = ErrorCode;

const shcValid = 'shc:/5676290952432060346029243740446031222959532654603460292540772804336028702864716745222809286133314564376531415906402203064504590856435503414245413640370636654171372412363803043756220467374075323239254334433260573601064529295312707424284350386122127671665437102572713671033607704238437029573022677054422260112125702173667306552834055853292365044133042632503575734057565806203442726012270475532526082065617325693400373855506565336534254359585267236622676634522224237355042142040455776757775641327211727325553644615950445650272520523412003275506143670530423874281257765440226766114533084457383158127632666872427032642042007536561127623955610036340961672503731027560331652952723277317322295650317030726732444576740924767727057636577766067053205607624529662976410358230538377628273053124538363235000504292074502524002073452857054407453207366522632923245812565245687531450077256023696400322703704110637029652807255236003957323704520443253877706769412940753912683852096440041050003405276564580371050707411061215403327009257569436724662653397259122472093477683209737500096441070572532710286045533433244157237436583055336832702667700540744322342832654566404055715705452820034577663333694261054168583966620926760560316671664568005812376005325605326170593372622277257241675773244233637064315511443374613329364126280373613536420661306739676808083370350773240976435077692129614466373122606608005735591043591007456970294352737422014372290354263611113564390855693371766453456020201041213628303826056145536361557511266952640658333043617603617020235911722366353055546212035024301262092630333130643411765820';

const testDirectory = {
    directory: "https://raw.githubusercontent.com/the-commons-project/vci-directory/main/vci-issuers.json",
    time: "2022-02-28T22:38:31Z",
    issuerInfo: [
        {
            issuer: {
                iss: "https://spec.smarthealth.cards/examples/issuer",
                name: "SMART Health Card Example"
            },
            keys: [
                {
                    kty: "EC",
                    kid: "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                    use: "sig",
                    alg: "ES256",
                    crv: "P-256",
                    x: "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw",
                    y: "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8"
                }
            ]
        }
    ]
};


let decoded: Context;

beforeAll(async () => {
    const context = new Context();
    context.shc = shcValid;
    decoded = await shc.decode(context);
});

function cloneContext(options?: Options): Context {
    const clone = new Context();
    clone.jws.header = utils.clone<JWSHeader>(decoded.jws.header as JWSHeader);
    clone.jws.payload = utils.clone<JWSPayload>(decoded.jws.payload as JWSPayload);
    clone.jws.signature = decoded.jws.signature?.slice(0);
    clone.compact = decoded.compact;
    options && (clone.options = options);
    return clone;
}

test('signature-verify-valid', async () => {
    const context = cloneContext({ directory: utils.clone<Directory>(testDirectory) });
    await signature.verify(context);
    checkErrors(context);
});

test('signature-verify-wrong-signature', async () => {
    const context = cloneContext({ directory: utils.clone<Directory>(testDirectory) });
    (context.jws.signature as Uint8Array)[4] = ((context.jws.signature as Uint8Array)[4] + 1 % 256);
    await signature.verify(context);
    checkErrors(context, EC.SIGNATURE_INVALID);
});

test('signature-verify-cjws-altered', async () => {
    const context = cloneContext({ directory: utils.clone<Directory>(testDirectory) });
    (context.compact as string) = (context.compact as string).replace('.', 'A.');
    await signature.verify(context);
    checkErrors(context, EC.SIGNATURE_INVALID);
});

test('signature-verify-issuerInfo-empty', async () => {
    const directory = utils.clone<Directory>(testDirectory);
    const context = cloneContext({directory});
    directory.issuerInfo = [];
    await signature.verify(context);
    checkErrors(context, EC.DIRECTORY_ISSUER_NOT_FOUND);
});

test('signature-verify-issuerInfo-undfined', async () => {
    const directory = utils.clone<Directory>(testDirectory);
    const context = cloneContext({directory});
    directory.issuerInfo = undefined as unknown as IssuerInfo[];
    await signature.verify(context);
    checkErrors(context, EC.DIRECTORY_SCHEMA_ERROR);
});

test('signature-verify-cannot-find-iss', async () => {
    const directory = utils.clone<Directory>(testDirectory);
    const context = cloneContext({directory});
    directory.issuerInfo[0].issuer.iss = 'foo';
    await signature.verify(context);
    checkErrors(context, EC.DIRECTORY_ISSUER_NOT_FOUND);
});

test('signature-verify-cannot-find-kid', async () => {
    const directory = utils.clone<Directory>(testDirectory);
    const context = cloneContext({directory});
    directory.issuerInfo[0].keys[0].kid = 'foo';
    await signature.verify(context);
    checkErrors(context, EC.DIRECTORY_KEY_NOT_FOUND);
});

test('signature-verify-issuer-name-missing', async () => {
    const directory = utils.clone<Directory>(testDirectory);
    const context = cloneContext({directory});
    delete (directory.issuerInfo[0].issuer as Partial<Issuer>).name;
    await signature.verify(context);
    checkErrors(context);
});

test('signature-verify-bad-key-kty', async () => {
    const directory = utils.clone<Directory>(testDirectory);
    const context = cloneContext({directory});
    directory.issuerInfo[0].keys[0].kty = 'foo';
    await signature.verify(context);
    checkErrors(context, [[EC.SIGNATURE_INVALID], [EC.JWK_INVALID_PROPERTY]]);
});

test('signature-verify-bad-key-alg', async () => {
    const directory = utils.clone<Directory>(testDirectory);
    const context = cloneContext({directory});
    directory.issuerInfo[0].keys[0].alg = 'foo';
    await signature.verify(context);
    checkErrors(context, [[EC.SIGNATURE_INVALID], [EC.JWK_INVALID_PROPERTY]]);
});


// with keys[] and no directory

test('signature-verify-valid-with-keys', async () => {
    const context = cloneContext({ keys: utils.clone<JWK[]>(testDirectory.issuerInfo[0].keys) });
    await signature.verify(context);
    checkErrors(context, [[],[ErrorCode.KEYS_ONLY_MATCH]]);
});

test('signature-verify-valid-with-non-matching-keys', async () => {
    const context = cloneContext({ keys: utils.clone<JWK[]>(testDirectory.issuerInfo[0].keys) });
    const key = context.options?.keys?.[0] as JWK;
    key.kid = key.x;
    await signature.verify(context);
    checkErrors(context, ErrorCode.DIRECTORY_KEY_NOT_FOUND);
});