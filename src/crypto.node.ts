/**
 * Note: This is the flimsiest of webcrypto wrappers around Node's 'crypto' API
 * 
 * This wrapper has hard-codings, assumptions, and ignores several parameters.
 * It is only unsuitable for this specific application and is not meant to 
 * be general purpose.
 * 
 */

import convert from "./convert.js";
import { JWK } from "./types.js";
import crypto from 'crypto';


function digest(algorithm: Algorithm, data: Uint8Array): Promise<ArrayBuffer> {

    return new Promise((resolve, reject) => {
        try {
            const alg = algorithm.name.replace('-', '').toLocaleLowerCase();
            resolve(crypto.createHash(alg).update(data).digest().buffer);
        } catch (err) {
            reject(err);
        }

    });
}


function importKey(format: 'jwk', publicKey: JsonWebKey, algorithm: Algorithm, extractable: boolean, usage: ["verify" | "sign"]): Promise<CryptoKey> {

    return new Promise((resolve, reject) => {
        try {
            const pemKey = usage[0] === 'sign' ? jwkToPrivatePEM(publicKey as JWK) : jwkToPublicPEM(publicKey as JWK)
            const key: CryptoKey = {key: pemKey} as unknown as CryptoKey;
            resolve(key);
        } catch (err) {
            reject(err);;
        }
    });
}


function verify(algorithm: Algorithm, key: CryptoKey, signature: Uint8Array, data: Uint8Array): Promise<boolean> {

    return new Promise((resolve, reject) => {
        try {
            const alg = (algorithm as unknown as {hash: {name: string}}).hash.name.replace('-', '').toUpperCase();
            // DER encode the signature
            const derSig = derSignature(signature);
            const pemKey = key as unknown as { key: string };
            resolve(crypto.createVerify(alg).update(data).end().verify(pemKey.key, derSig));
        } catch (err) {
            reject(err);
        }
    });
}


function sign(algorithm: Algorithm, key: CryptoKey, data: Uint8Array): Promise<ArrayBuffer> {

    return new Promise((resolve, reject) => {
        try {
            const alg = (algorithm as unknown as {hash: {name: string}}).hash.name.replace('-', '').toUpperCase();
            const pemKey = key as unknown as { key: string };
            const buffer = crypto.createSign(alg).update(data).sign(pemKey.key); 
            const unDer = unDerSignature(buffer);
            resolve(unDer);
        } catch (err) {
            reject(err);
        }
    });
}


function unDerSignature(buffer: ArrayBuffer): ArrayBuffer {

    const bytes = new Uint8Array(buffer);

    const rLen = bytes[3];
    const sLen = bytes[3 + rLen + 2];

    let rBytes = bytes.slice(4, rLen + 4);
    // pad zeros when less than 32 bytes
    while (rBytes.length < 32) {
        rBytes = new Uint8Array([0, ...rBytes]);
    }
    // trim extra zero for sign, if present
    if (rBytes.length > 32 && rBytes[0] === 0) {
        rBytes = rBytes.slice(1);
    }

    let sBytes = bytes.slice(4 + rLen + 2);
    while (sBytes.length < 32) {
        sBytes = new Uint8Array([0, ...sBytes]);
    }
    if (sBytes.length > 32 && sBytes[0] === 0) {
        sBytes = sBytes.slice(1);
    }

    const rs = new Uint8Array([...rBytes, ...sBytes]);

    return rs.buffer;
}


function derSignature(bytes: Uint8Array): Uint8Array {

    let rBytes = bytes.slice(0, 32);
    let sBytes = bytes.slice(32);

    // trim zero padding
    while (rBytes[0] === 0) {
        rBytes = rBytes.slice(1);
    }

    while (sBytes[0] === 0) {
        sBytes = sBytes.slice(1);
    }

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

    // when the length > 127 we need a 2-byte length
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

        0x04, // Octetstring w/key Sequence
        keySeq.length,
        ...keySeq

    ]);

    const b64 = convert.bytesToBase64(der);

    const lines = b64.match(/(.{1,64})/g) as Array<string>;
    lines.unshift('-----BEGIN PRIVATE KEY-----');
    lines.push('-----END PRIVATE KEY-----');

    return lines.join('\n');
}


const subtle = {importKey, digest, verify, sign}


export {subtle};
