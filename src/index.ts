// This is the secret to include this polyfill with babel & rollup with tree-shaking
// Include the lib without accessing it. It would have been nice if this was documented anywhere
import '@zxing/text-encoding';
import 'cross-fetch/polyfill';
//import '@microsoft/msrcrypto/lib/IE11PromiseWrapper';
import shc_validator from './shc'
import qr_validator from './qr'
import jws_validator from './jws';
import jws_header from './jws.header';
import jws_payload from './jws.payload'
import jws_signature from './jws.signature'
import fhir_validator from './fhir'
import ValidationContext from './context'
import { FhirBundle, IOptions, JWS, JWSHeader, JWSPayload } from './types'
import { Log } from './log'

export default {

    validate: {

        // shc: async function (context: ValidationContext): Promise<ValidationContext> {
        //     return shc_validator.validate(context);
        // },

        jws: async function (context: ValidationContext): Promise<ValidationContext> {
            return jws_validator.validate(context);
        },

        header: function (context: ValidationContext): ValidationContext {
            return jws_header.validate(context);
        },

        // payload: async function (context: ValidationContext): Promise<ValidationContext> {
        //     return jws_payload.validate(context);
        // },

        // signature: function (context: ValidationContext): ValidationContext {
        //     return jws_signature.validate(context);
        // },

        // fhir: async function (context: ValidationContext): Promise<ValidationContext> {
        //     return fhir_validator.validate(context);
        // },
    },

    decode: {

        qr: async function (url: string, options?: IOptions): Promise<ValidationContext> {
            return qr_validator.decode(url, new ValidationContext(new Log(), options));
        },

        shc: async function (shc: string, options?: IOptions): Promise<ValidationContext> {
            return shc_validator.decode(shc, new ValidationContext(new Log(), options));
        },

        jws: function (compactJws: string, options?: IOptions): ValidationContext {
            return jws_validator.decode(compactJws, new ValidationContext(new Log(), options));
        },

        header: function (header: string, options?: IOptions): ValidationContext {
            return jws_header.decode(header, new ValidationContext(new Log(), options));
        },

        payload: function (payload: string, options?: IOptions): ValidationContext {
            return jws_payload.decode(payload, new ValidationContext(new Log(), options));
        },

        signature: function (signature: string, options?: IOptions): ValidationContext {
            return jws_signature.decode(signature, new ValidationContext(new Log(), options));
        },

    }
}




