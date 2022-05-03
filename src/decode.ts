import Context from "./context.js";
import { ShcNumeric, QRUrl, JWSCompact, Options, JWSFlat, Base64Url } from "./types.js";
import { is, determineArtifact } from "./utils.js";
import qr_decoder from './qr.js';
import shc_decoder from './shc.js';
import compact_decoder from './jws.compact.js';
import flat_decoder from './jws.flat.js';
import jws_header from './jws.header.js';
import jws_payload from './jws.payload.js';
import jws_signature from './jws.signature.js';
import { ErrorCode } from "./error.js";


type artifacts = 'qr' | 'shc' | 'jws.compact' | 'jws.flat' | 'jws.header' | 'jws.payload' | 'jws.signature';

const validTypes = ['qr', 'shc', 'jws.compact', 'jws.flat', 'jws.header', 'jws.payload', 'jws.signature'];

async function decode(code: ShcNumeric | QRUrl | JWSCompact | JWSFlat): Promise<Context>
async function decode(code: ShcNumeric | QRUrl | JWSCompact | JWSFlat, options: Options): Promise<Context>
async function decode(code: ShcNumeric | QRUrl | JWSCompact | JWSFlat, type: artifacts): Promise<Context>
async function decode(code: ShcNumeric | QRUrl | JWSCompact | JWSFlat, type: artifacts, options: Options): Promise<Context>
async function decode(code: ShcNumeric | QRUrl | JWSCompact | JWSFlat, artifactOrOptions?: artifacts | Options, options?: Options): Promise<Context> {

    let artifact = undefined;
    options = options || {};

    if (typeof artifactOrOptions === 'string') {
        artifact = artifactOrOptions;
    } else if (is.object(artifactOrOptions)) {
        options = artifactOrOptions;
    }

    artifact = artifact || determineArtifact(code);

    const context = new Context(options);

    if (artifact && !validTypes.includes(artifact)) {
        return context.log().fatal(`Parameter 'type' is not a valid value (${validTypes.join('|')})`, ErrorCode.PARAMETER_INVALID);
    }

    switch (artifact) {

        case 'qr':
            context.qr = code as QRUrl;
            await qr_decoder.decode(context);
            break;

        case 'shc':
            context.shc = code as ShcNumeric;
            await shc_decoder.decode(context);
            break;

        case 'jws.compact':
            context.compact = code as JWSCompact;
            compact_decoder.decode(context);
            break;

        case 'jws.flat':
            context.flat = code as JWSFlat;
            flat_decoder.decode(context);
            break;

        case 'jws.header':
            context.flat.header = code as Base64Url;
            jws_header.decode(context);
            break;

        case 'jws.payload':
            context.flat.payload = code as Base64Url;
            jws_payload.decode(context);
            break;

        case 'jws.signature':
            context.flat.signature = code as Base64Url;
            jws_signature.decode(context);
            break;

        default:
            context.log().fatal(`Cannot determine artifact type from code`)
    }

    return context;
}

export default decode;
