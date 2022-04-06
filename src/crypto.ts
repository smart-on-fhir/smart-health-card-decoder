// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import convert from "./convert";
import { JWK } from "./types";


// The lib types for Node does not properly expose the webcrypto api, 
// so we have to declare it ourselves to keep TS happy. 
declare module "crypto" {
    namespace webcrypto {
        const subtle: SubtleCrypto;
    }
}


// Using commonjs type imports to avoid the static imports of esm and the errors it creates when the import is not present
// Require may or may not exist, so we create a do-nothing function if it's not found.
const req = (typeof require === 'function') ? require : () => { };
const nodeCrypto = req('crypto');
const browserCrypto = typeof crypto === 'undefined' ? undefined : crypto;


let subtle: SubtleCrypto | undefined;

// Node 15+ : use Node's webcrypto api
if (nodeCrypto?.webcrypto) {
    subtle = nodeCrypto.webcrypto.subtle;
}

// Browser : user built-in webcrypto api
else if (browserCrypto?.subtle) {
    subtle = browserCrypto.subtle;
}

// Webcrypto polyfill if we can't find any of the above crypto apis
// IE11 uses mscrypto.subtle, but it does not have the EC algorithms we need so we polyfill it instead of shimming its webcrypto api
if (!nodeCrypto && !subtle) {
    subtle = req('../lib/msrCrypto.cjs')?.subtle;
}


// if nodeCrypto && !subtle, then we are using Node14 (or earlier) crypto


function nodeHash(data: BufferSource): Promise<string> {
    try {
        return Promise.resolve((nodeCrypto.createHash('sha256').update(data).digest() as Buffer).toString('base64url'));
    } catch (err) {
        throw err;
    }
}


function nodeVerify(publicKey: JWK, signature: Uint8Array, data: Uint8Array): Promise<boolean> {

    try {

        // convert the JWK key to a PEM key
        const pemKey = jwkToPublicPEM(publicKey as JWK);

        // DER encode the signature
        const derSig = derSignature(signature);

        // check the signature
        const result = nodeCrypto.createVerify('SHA256').update(data).end().verify(pemKey, derSig);

        return Promise.resolve(result);

    } catch (err) {
        throw err;
    }
}


function nodeSign(privateKey: JWK, data: Uint8Array): Promise<ArrayBuffer> {

    try {
        // convert the JWK key to a PEM key
        const pemKey = jwkToPrivatePEM(privateKey as JWK);

        // sign the data
        const buffer = nodeCrypto.createSign('SHA256').update(data).sign(pemKey);

        // decode the DER encoding into an r||s byte array
        const nonDer = unDerSignature(buffer);

        return Promise.resolve(nonDer);

    } catch (err) {
        throw err;
    }
}


function subtleHash(data: BufferSource): Promise<string> {

    if (!subtle) throw new Error('Could not find crypto object');

    return subtle.digest({ name: "SHA-256", }, data)
        .then((arrayBuffer: ArrayBuffer) => {
            const uint8 = new Uint8Array(arrayBuffer);
            const hash = convert.bytesToBase64(uint8, true);
            return hash;
        })
        .catch((error: Error) => {
            throw error;
        });

}


function subtleVerify(publicKey: JsonWebKey, signature: Uint8Array, data: Uint8Array): Promise<boolean> {

    if (!subtle) throw new Error('Could not find crypto object');

    return subtle.importKey("jwk", publicKey as JsonWebKey, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"])
        .then(cryptoKey => {
            return (subtle as SubtleCrypto).verify({ name: "ECDSA", hash: { name: "SHA-256" } }, cryptoKey, signature, data);
        })
        .then(verified => {
            return verified;
        })
        .catch(err => {
            throw err;
        });

}


function subtleSign(privateKey: JsonWebKey, data: Uint8Array): Promise<ArrayBuffer> {

    if (!subtle) throw new Error('Could not find crypto object');

    return subtle.importKey("jwk", privateKey as JsonWebKey, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"])
        .then(cryptoKey => {
            return (subtle as SubtleCrypto).sign({ name: "ECDSA", hash: { name: "SHA-256" } }, cryptoKey, data);
        })
        .then(signature => {
            return signature;
        })
        .catch(err => {
            throw err;
        });
}


function unDerSignature(buffer: ArrayBuffer): ArrayBuffer {

    const bytes = new Uint8Array(buffer);

    // For signature use, the sign is irrelevant and the leading zero, if present, is ignored.
    const rStart = 4 + (bytes[3] - 32);  // adjust for the potential leading zero
    const rBytes = bytes.slice(rStart, rStart + 32); // 32 bytes of the r-integer 
    const sStart = bytes.length - 32; // gets the last 32, so we can ignore any leading zero
    const sBytes = bytes.slice(sStart); // 32 bytes of the s-integer

    const rs = new Uint8Array([...rBytes, ...sBytes]);

    return rs.buffer;
}


function derSignature(bytes: Uint8Array): Uint8Array {

    let rBytes = bytes.slice(0, 32);
    let sBytes = bytes.slice(32);

    // if the high-order bit is set, pre-pend a zero to keep the asn.1 Integer as a positive number
    if (rBytes[0] & 128) {
        rBytes = new Uint8Array([0, ...rBytes]);
    }
    if (sBytes[0] & 128) {
        sBytes = new Uint8Array([0, ...sBytes]);
    }

    // compute the length of the Sequence data
    const seqLen = 2 /*integer header*/ + rBytes.length + 2 /*integer header*/ + sBytes.length;

    // create a single byte array as a DER encoded Sequence of two Integers
    const der = new Uint8Array([
        0x30, // Sequence type
        seqLen, // Length of the Sequence data
        0x02, // Integer type
        rBytes.length, // Integer data length
        ...rBytes, // Integer data
        0x02, // Integer type
        sBytes.length, // Integer data length
        ...sBytes // Integer data
    ]);

    return der;
}


function jwkToPublicPEM(jwk: JWK): string {

    //  1.2.840.10045.2.1 
    const ecPublicOid = [0x06, 0x07, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01];

    // 1.2.840.10045.3.1.7
    const p256Oid = [0x06, 0x08, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x03, 0x01, 0x07];

    const x = convert.base64ToBytes(jwk.x);
    const y = convert.base64ToBytes(jwk.y);

    const innerSeq = new Uint8Array([
        0x30, // Sequence type
        ecPublicOid.length + p256Oid.length,
        ...ecPublicOid,
        ...p256Oid
    ]);

    const bitString = new Uint8Array([
        0x03, // Bitstring type
        1 + 1 + x.length + y.length,
        0, // always 0
        4, // always 4
        ...x,
        ...y
    ]);

    const der = new Uint8Array([
        0x30, // Sequence type
        innerSeq.length + bitString.length,
        ...innerSeq,
        ...bitString
    ]);

    const b64 = convert.bytesToBase64(der);

    const lines = b64.match(/(.{1,64})/g) as Array<string>;
    lines.unshift('-----BEGIN PUBLIC KEY-----');
    lines.push('-----END PUBLIC KEY-----');

    return lines.join('\n');
}


function jwkToPrivatePEM(jwk: JWK): string {

    //  1.2.840.10045.2.1 
    const ecPublicOid = [0x06, 0x07, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01];

    // 1.2.840.10045.3.1.7
    const p256Oid = [0x06, 0x08, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x03, 0x01, 0x07];

    const x = convert.base64ToBytes(jwk.x);
    const y = convert.base64ToBytes(jwk.y);
    const d = convert.base64ToBytes(jwk.d as string);

    const oidSeq = new Uint8Array([
        0x30, // Sequence type
        ecPublicOid.length + p256Oid.length,
        ...ecPublicOid,
        ...p256Oid
    ]);

    const bitString = new Uint8Array([
        0x03, // Bitstring type
        1 + 1 + x.length + y.length,
        0, // always 0
        4, // always 4
        ...x,
        ...y
    ]);

    const keySeq = new Uint8Array([
        0x30, // Sequence type
        3 + (d.length + 2) + (p256Oid.length + 2) + (bitString.length + 2),

        0x02,  // Integer 1
        1,
        1,

        0x04, // OctetString w/ private key
        d.length,
        ...d,

        0xA0, // Custom 0 w/ oid
        p256Oid.length,
        ...p256Oid,

        0xA1, // Custom 1 w/ public key Bitstring
        bitString.length,
        ...bitString
    ]);

    let derLen = [3 + oidSeq.length + (keySeq.length + 2)];
    if (derLen[0] > 128) {
        derLen = [129, derLen[0]];
    }

    const der = new Uint8Array([
        0x30, // Sequence type
        ...derLen,

        0x02, // Integer 0
        1,
        0,

        ...oidSeq, // Sequence with oids

        0x04, // Octetstring w/key Sequnce
        keySeq.length,
        ...keySeq

    ]);

    const b64 = convert.bytesToBase64(der);

    const lines = b64.match(/(.{1,64})/g) as Array<string>;
    lines.unshift('-----BEGIN PRIVATE KEY-----');
    lines.push('-----END PRIVATE KEY-----');

    return lines.join('\n');
}


function hash(data: BufferSource): Promise<string> {
    return (subtle ? subtleHash : nodeHash)(data).catch(err => {
        throw err
    });
}


function verify(publicKey: JWK, signature: Uint8Array, data: Uint8Array): Promise<boolean> {
    return (subtle ? subtleVerify : nodeVerify)(publicKey, signature, data).catch(err => {
        return false;
    });
}


function sign(privateKey: JWK, data: Uint8Array): Promise<ArrayBuffer> {
    return (subtle ? subtleSign : nodeSign)(privateKey, data).catch(err => {
        throw err;
    });
}


export { hash, sign, verify }
