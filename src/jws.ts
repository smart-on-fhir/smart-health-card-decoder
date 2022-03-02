import { ErrorCode } from "./error";
import { Artifact } from "./log";
import ValidationContext from "./context";
import jws_header from './jws.header';
import jws_payload from './jws.payload';
import jws_signature from './jws.signature';
import fhir from './fhir';
import { Directory, Issuer, IssuerInfo, JWK, JWS, JWSPayload, KeySet } from "./types";
import { dir } from "console";
import { Dir } from "fs";
//import { webcrypto } from 'crypto';



const cjwsWithWhitespace = /^\s*[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\s*$/;
const cjws = /([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)/;




function decode(compactJws: string, context: ValidationContext): ValidationContext {

    const { log } = context;
    log.artifact = Artifact.COMPACTJWS;

    if (typeof compactJws !== 'string') {
        log.fatal(`compactJws parameter not a string`, ErrorCode.INVALID_COMPACT_JWS);
        return context;
    }

    if (!cjwsWithWhitespace.test(compactJws)) {
        log.fatal(`Invalid compact-JWS format. Expect [a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+`, ErrorCode.INVALID_COMPACT_JWS);
        return context;
    };

    const [, headerB64, payloadB64, signatureB64] = cjws.exec(compactJws) ?? [];

    jws_header.decode(headerB64, context);

    jws_signature.decode(signatureB64, context);

    jws_payload.decode(payloadB64, context);

    // set context.fhirbundle if it exists in the jws.payload
    if (context?.jws?.payload?.vc?.credentialSubject?.fhirBundle) context.fhirbundle = context?.jws?.payload?.vc?.credentialSubject?.fhirBundle;

    return context;
}



async function validate(context: ValidationContext): Promise<ValidationContext> {

    const { log } = context;
    log.artifact = Artifact.COMPACTJWS;

    if (!context.jwscompact) {
        log.fatal('cannot verify signature without compact jws string', ErrorCode.INVALID_COMPACT_JWS);
        return context;
    }

    if (!context.jws) {
        log.fatal('Missing context.jws. Cannot validate.', ErrorCode.ERROR);
        return context;
    }

    const jws = context.jws;

    // //
    // // Get iss property from payload to download keySet
    // //
    // if (!('iss' in jws.payload)) {
    //     log.fatal(`JWS Payload missing 'iss' property. Cannot download public signing key.`);
    //     return context;
    // }

    // //
    // // Get kid property from header
    // //
    // if (!('kid' in jws.header)) {
    //     log.fatal(`JWS Payload missing 'iss' property. Cannot download public signing key.`);
    //     return context;
    // }

    jws_payload.validate(context);
    jws_header.validate(context);
    jws_signature.validate(context);


    const issuers = await setDirectory(context);
    if (!issuers || issuers.length === 0) {
        log.fatal(`No keys available to verify signature.`);
        return context;
    }

    const info = lookupIssuer(issuers, context);
    if (!info) {
        log.fatal(`Could not find issuer with iss: ${context.jws.payload?.iss} or key with kid: ${context.jws.header.kid}.`);
        return context;
    }

    //
    // We need the compact jws.header + jws.payload to verify the signature
    // We're assuming we have this in the context.
    // TODO: Generate the compact-jws if it's not in the context as the user may call this directly
    //
    const signed = context.jwscompact?.split('.', 2).join('.') ?? '';

    const verified = await checkSignature(signed, new Uint8Array(jws.signature), info.keys[0]);

    context.signature = {
        iss: context.jws.payload.iss,
        name: info.issuer.name,
        kid: context.jws.header.kid,
        verified
    };

    if (verified === false) {
        log.fatal('JWS Signature not valid', ErrorCode.INVALID_SIGNATURE);
    }

    //
    // This doesn't do anything but assign the context.fhirbundle property to 
    //
    await fhir.decode(context);

    return context;

}


function lookupIssuer(issuers: Array<IssuerInfo>, context: ValidationContext): IssuerInfo | undefined {

    const iss = context.jws?.payload.iss;
    const kid = context.jws?.header.kid;

    const issuerInfo = issuers.find(info => info.issuer.iss === iss);
    if (!issuerInfo) {
        context.log.debug(`Issuer with iss: ${iss} not found.`);
        return;
    }

    const key = issuerInfo.keys.find((key: JWK) => key.kid === kid);
    if (!key) {
        context.log.debug(`Key with kid: ${kid} not found.`);
        return;
    };

    return {
        issuer: issuerInfo.issuer,
        keys: [key]
    };
}


async function setDirectory(context: ValidationContext): Promise<Array<IssuerInfo>> {

    // context already has directory, return it
    if (context.options?.directory?.issuerInfo) return Promise.resolve(context.options.directory.issuerInfo);

    // context has issuers, download keys for each, build directory
    if (context.options?.issuers) {

        const ii: Array<IssuerInfo> = [];

        context.options?.issuers.forEach(async (issuer: Issuer) => {
            ii.push({
                issuer,
                keys: await downloadIssuerKeys(issuer.iss)
            });
        });

        return ii;
    }

    // context has keys, get iss and build directory with single item
    if (context.options?.keys) {
        return [
            {
                issuer: {
                    iss: context.jws?.payload?.iss ?? '',
                    name: context.jws?.payload.iss ?? '',
                },
                keys: context.options?.keys
            }
        ];
    }

    // nothing supplied, lookup iss, download keys, build directory
    return [{
        issuer: {
            iss: context.jws?.payload?.iss ?? '',
            name: context.jws?.payload.iss ?? '',
        },
        keys: (await downloadIssuerKeys(context.jws?.payload.iss ?? ''))
    }];

}


async function downloadPublicKeys(payload: JWSPayload): Promise<JWK[]> {
    const issuerURL = payload.iss;
    const jwkURL = `${issuerURL}/.well-known/jwks.json`;
    const keySet = await (await fetch(jwkURL)).json();
    return keySet.keys;
}

async function downloadIssuerKeys(url: string): Promise<JWK[]> {
    const jwkURL = `${url}/.well-known/jwks.json`;
    const response = await (await fetch(jwkURL)).json();
    return response.keys;
}


async function checkSignature(jws: string, signature: Uint8Array, key: JWK): Promise<boolean> {

    // const key = keySet.keys.find((k: JWK) => k.kid === kid);

    // if (!key) throw new Error();

    const jwsBytes = new TextEncoder().encode(jws);

    //const subtle = (typeof crypto === undefined) ? crypto?.subtle : webcrypto
    const subtle = crypto?.subtle;

    const cryptoKey = await subtle.importKey("jwk", key, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    const validated = await subtle.verify({ name: "ECDSA", hash: { name: "SHA-256" } }, cryptoKey, signature, jwsBytes);

    return validated;
};

export default { decode, validate };
