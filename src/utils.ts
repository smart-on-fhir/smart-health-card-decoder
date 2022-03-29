// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Base64Url } from "./types.js";


const base64urlAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const base64urlPattern = /^[\w-]{2,}$/;


function parseJson<T>(json: string): T | undefined {
    try {
        return JSON.parse(json) as T;
    } catch {
        return undefined;
    }
}

function isObject(a: any): a is Record<string | number | symbol, any> {
    return a && (typeof a === 'function' || typeof a === 'object');
}

function isBase64url(base64url: any, strict = false): base64url is Base64Url {

    if (typeof base64url !== 'string') return false;

    // has 2 or more valid base64url chars
    if (!base64urlPattern.test(base64url.trim())) return false;

    if (!strict) return true;

    // bits beyond the last byte boundry must be zeros
    const overflowBits = (base64url.length * 6) % 8;

    // return true if there is no overflow
    if (overflowBits === 0) return true;

    // get the overflow bits
    const lastChar = base64urlAlphabet.indexOf(base64url.charAt(base64url.length - 1));
    const overflow = lastChar & ((1 << overflowBits) - 1);

    // they should be 0
    return overflow === 0;
}

function isStringArray(strArray: any): strArray is string[] {
    if (!(strArray instanceof Array)) return false;
    return strArray.every(element => typeof element === 'string');
}


function determineArtifact(artifact: any): 'qr' | 'shc' | 'jws.compact' | 'jws.flat' | 'jws' | undefined {

    if (/data:image\/(png|jpeg);base64,[0-9A-Za-z+\/]{2,}={0,2}/.test(artifact)) return 'qr';

    if (/shc:\/(\d\d)+/.test(artifact)) return 'shc';

    if (/^\s*[0-9A-Za-z\-_]{2,}\.[0-9A-Za-z\-_]{2,}\.[0-9A-Za-z\-_]{2,}\s*$/.test(artifact)) return 'jws.compact';

    if (is.object(artifact) && 'header' in artifact && 'payload' in artifact && 'signature' in artifact) {
        if(is.base64url(artifact.header)) return 'jws.flat';
        return 'jws';
    }

    return undefined;

}


function clone<T>(object: object): T {
    return JSON.parse(JSON.stringify(object));
}


const is = {
    object: isObject,
    stringArray: isStringArray,
    base64url: isBase64url
}


export default {
    parseJson,
    is,
    clone,
    determineArtifact
}
