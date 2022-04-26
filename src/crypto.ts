import convert from "./convert.js";
import msrCrypto from "../lib/msrCrypto.cjs";


// The lib types for Node does not properly expose the webcrypto api, 
// so we have to declare it ourselves to keep TS happy. 
declare module "crypto" {
    namespace webcrypto {
        const subtle: SubtleCrypto;
    }
}


const HASH_ALGORITHM = "SHA-256";;
const SIGNATURE_ALGORITHM = "ECDSA";
const ECC_CURVE = "P-256";


const subtle = selectSubtle();

/**
 * Select which version of the web-crypto-api to use
 * 1. Node 15+ 
 * 2. Browser 
 * 3. Node <=14 crypto api with thin web-crypto-api wrapper
 * 4. Polyfill
 */
function selectSubtle() {

    // Using commonjs type imports to avoid the static imports of esm and the errors it creates when the import is not present
    // Require may or may not exist, so we create a do-nothing function if it's not found.
    const req = (typeof require === 'function') ? require : () => { };
    let nodeCrypto;
    try {
        nodeCrypto = req('crypto');
    } catch { }
    const browserCrypto = typeof crypto === 'undefined' ? undefined : crypto;


    let subtle: SubtleCrypto | undefined;

    // Node 15+ : use Node's webcrypto api
    if (nodeCrypto?.webcrypto) {
        subtle = nodeCrypto.webcrypto.subtle;
    }

    // Node <=14: use Node's not-web-crypto with subtle wrapper
    else if (nodeCrypto) {
        subtle = req('./crypto.node.js').subtle;
    }

    // Browser : user built-in webcrypto api - or polyfill
    else if (browserCrypto?.subtle) {
        subtle = browserCrypto.subtle;
    }

    //Webcrypto polyfill if we can't find any of the above crypto apis
    //IE11 uses mscrypto.subtle, but it does not have the EC algorithms we need so we polyfill it instead of shimming its webcrypto api
    else {
        subtle = msrCrypto.subtle as SubtleCrypto;
    }

    return subtle;
}


function hash(data: BufferSource): Promise<string> {

    if (!subtle) throw new Error('Could not find crypto object');

    return subtle.digest({ name: HASH_ALGORITHM, }, data)
        .then((arrayBuffer: ArrayBuffer) => {
            const uint8 = new Uint8Array(arrayBuffer);
            const hash = convert.bytesToBase64(uint8, true);
            return hash;
        })
        .catch((error: Error) => {
            throw error;
        });

}


function verify(publicKey: JsonWebKey, signature: Uint8Array, data: Uint8Array): Promise<boolean> {

    if (!subtle) throw new Error('Could not find crypto object');

    return subtle.importKey("jwk", publicKey as JsonWebKey, { name: SIGNATURE_ALGORITHM, namedCurve: ECC_CURVE }, false, ["verify"])
        .then(cryptoKey => {
            return (subtle as SubtleCrypto).verify({ name: SIGNATURE_ALGORITHM, hash: { name: HASH_ALGORITHM } }, cryptoKey, signature, data);
        })
        .then(verified => {
            return verified;
        })
        .catch(err => {
            throw err;
        });

}


function sign(privateKey: JsonWebKey, data: Uint8Array): Promise<ArrayBuffer> {

    if (!subtle) throw new Error('Could not find crypto object');

    return subtle.importKey("jwk", privateKey as JsonWebKey, { name: SIGNATURE_ALGORITHM, namedCurve: ECC_CURVE }, false, ["sign"])
        .then(cryptoKey => {
            return (subtle as SubtleCrypto).sign({ name: SIGNATURE_ALGORITHM, hash: { name: HASH_ALGORITHM } }, cryptoKey, data);
        })
        .then(signature => {
            return signature;
        })
        .catch(err => {
            throw err;
        });
}


export { hash, sign, verify };
