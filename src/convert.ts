const encodingChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

function textToBytes(text: string): Uint8Array {

    var encodedBytes = [];

    for (var i = 0, j = 0; i < text.length; i++) {

        var charCode = text.charCodeAt(i);

        if (charCode < 128) {
            encodedBytes[j++] = charCode;

        } else if (charCode < 2048) {
            encodedBytes[j++] = (charCode >>> 6) | 192;
            encodedBytes[j++] = (charCode & 63) | 128;

        } else if (charCode < 0xD800 || charCode > 0xDFFF) {
            encodedBytes[j++] = (charCode >>> 12) | 224;
            encodedBytes[j++] = ((charCode >>> 6) & 63) | 128;
            encodedBytes[j++] = (charCode & 63) | 128;

        } else {// surrogate pair (charCode >= 0xD800 && charCode <= 0xDFFF)
            charCode = ((charCode - 0xD800) * 0x400) + (text.charCodeAt(++i) - 0xDC00) + 0x10000;
            encodedBytes[j++] = (charCode >>> 18) | 240;
            encodedBytes[j++] = ((charCode >>> 12) & 63) | 128;
            encodedBytes[j++] = (charCode >>> 6) & 63 | 128;
            encodedBytes[j++] = (charCode & 63) | 128;
        }
    }

    return new Uint8Array(encodedBytes);
}

function bytesToText(textBytes: Uint8Array): string {

    var result = "",
        charCode;

    for (var i = 0; i < textBytes.length;) {

        var encodedChar = textBytes[i++];

        if (encodedChar < 128) {
            charCode = encodedChar;

        } else if (encodedChar < 224) {
            charCode = (encodedChar << 6) + textBytes[i++] - 0x3080;

        } else if (encodedChar < 240) {
            charCode =
                (encodedChar << 12) + (textBytes[i++] << 6) + textBytes[i++] - 0xE2080;

        } else {
            charCode =
                (encodedChar << 18) + (textBytes[i++] << 12) + (textBytes[i++] << 6) + textBytes[i++] - 0x3C82080;
        }

        // Four byte UTF-8; Convert to UTF-16 surrogate pair
        if (charCode > 0xFFFF) {
            var surrogateHigh = Math.floor((charCode - 0x10000) / 0x400) + 0xD800;
            var surrogateLow = ((charCode - 0x10000) % 0x400) + 0xDC00;
            result += String.fromCharCode(surrogateHigh, surrogateLow);
            continue;
        }

        result += String.fromCharCode(charCode);
    }

    return result;
}

function bytesToBase64(input: Uint8Array, base64Url = false): string {

    var char1, char2, char3, enc1, enc2, enc3, enc4;
    var i;
    let output = '';

    for (i = 0; i < input.length; i += 3) {

        // Get the next three chars.
        char1 = input[i];
        char2 = input[i + 1];
        char3 = input[i + 2];

        // Encode three bytes over four 6-bit values.
        // [A7,A6,A5,A4,A3,A2,A1,A0][B7,B6,B5,B4,B3,B2,B1,B0][C7,C6,C5,C4,C3,C2,C1,C0].
        // [A7,A6,A5,A4,A3,A2][A1,A0,B7,B6,B5,B4][B3,B2,B1,B0,C7,C6][C5,C4,C3,C2,C1,C0].

        // 'enc1' = high 6-bits from char1
        enc1 = char1 >> 2;
        // 'enc2' = 2 low-bits of char1 + 4 high-bits of char2
        enc2 = ((char1 & 0x3) << 4) | (char2 >> 4);
        // 'enc3' = 4 low-bits of char2 + 2 high-bits of char3
        enc3 = ((char2 & 0xF) << 2) | (char3 >> 6);
        // 'enc4' = 6 low-bits of char3
        enc4 = char3 & 0x3F;

        // 'char2' could be 'nothing' if there is only one char left to encode
        //   if so, set enc3 & enc4 to 64 as padding.
        if (isNaN(char2)) {
            enc3 = enc4 = 64;

            // If there was only two chars to encode char3 will be 'nothing'
            //   set enc4 to 64 as padding.
        } else if (isNaN(char3)) {
            enc4 = 64;
        }

        // Lookup the base-64 value for each encoding.
        output = output +
            encodingChars.charAt(enc1) +
            encodingChars.charAt(enc2) +
            encodingChars.charAt(enc3) +
            encodingChars.charAt(enc4);

    }

    if (base64Url) {
        return output.replace(/\+/g, "-").replace(/\//g, "_").replace(/\=/g, "");
    }

    return output;
}

function base64ToBytes(encodedString: string): Uint8Array {

    // This could be encoded as base64url (different from base64)
    encodedString = encodedString.replace(/-/g, "+").replace(/_/g, "/");

    // In case the padding is missing, add some.
    while (encodedString.length % 4 !== 0) {
        encodedString += "=";
    }

    var output = [];
    var char1, char2, char3;
    var enc1, enc2, enc3, enc4;
    var i;

    for (i = 0; i < encodedString.length; i += 4) {

        // Get 4 characters from the encoded string.
        enc1 = encodingChars.indexOf(encodedString.charAt(i));
        enc2 = encodingChars.indexOf(encodedString.charAt(i + 1));
        enc3 = encodingChars.indexOf(encodedString.charAt(i + 2));
        enc4 = encodingChars.indexOf(encodedString.charAt(i + 3));

        // Convert four 6-bit values to three 8-bit characters.
        // [A7,A6,A5,A4,A3,A2][A1,A0, B7,B6,B5,B4][B3,B2,B1,B0, C7,C6][C5,C4,C3,C2,C1,C0].
        // [A7,A6,A5,A4,A3,A2, A1,A0][B7,B6,B5,B4, B3,B2,B1,B0][C7,C6, C5,C4,C3,C2,C1,C0].

        // 'char1' = all 6 bits of enc1 + 2 high-bits of enc2.
        char1 = (enc1 << 2) | (enc2 >> 4);
        // 'char2' = 4 low-bits of enc2 + 4 high-bits of enc3.
        char2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        // 'char3' = 2 low-bits of enc3 + all 6 bits of enc4.
        char3 = ((enc3 & 3) << 6) | enc4;

        // Convert char1 to string character and append to output
        output.push(char1);

        // 'enc3' could be padding
        //   if so, 'char2' is ignored.
        if (enc3 !== 64) {
            output.push(char2);
        }

        // 'enc4' could be padding
        //   if so, 'char3' is ignored.
        if (enc4 !== 64) {
            output.push(char3);
        }

    }

    return new Uint8Array(output);

}

function textToBase64(text: string, base64Url = false): string {
    const bytes = textToBytes(text);
    return bytesToBase64(bytes, base64Url);
}

function base64ToText(base64: string): string {
    const bytes = base64ToBytes(base64);
    return bytesToText(bytes);
}

export default {
    textToBytes,
    bytesToText,
    bytesToBase64,
    base64ToBytes,
    textToBase64,
    base64ToText,
}
