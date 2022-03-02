function toBase64(base64url: string): string {
    const decoded = base64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(base64url.length % 4, '=');
    return decoded;
}

function toBytes(base64url: string): Uint8Array {
    const base64 = toBase64(base64url);
    const decodedString = atob(base64);
    const bytes = new Uint8Array(decodedString.split('').map(c => c.charCodeAt(0)));
    return bytes;
}

function toArrayBuffer(base64url: string): ArrayBuffer {
    return toBytes(base64url).buffer;
}

function toUtf8(base64url: string): string {
    const arrayBuffer = toArrayBuffer(base64url);
    const utf8 = new TextDecoder("utf-8").decode(arrayBuffer);
    return utf8;
}

const isBase64url = (base64url: any): boolean => (typeof base64url === 'string') && /[\w-]+/.test(base64url);

export default {
    toBase64,
    toBytes,
    toArrayBuffer,
    toUtf8,
    isBase64url
};