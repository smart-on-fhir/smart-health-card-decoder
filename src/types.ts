import { Log } from "./log";

export interface JWSHeader {
    [x: string]: string;
    alg: string,
    kid: string,
    zip: string
}

export interface JWS {
    header: JWSHeader,
    payload: JWSPayload,
    signature: Uint8Array
}

export interface JWSPayload {
    iss: string,
    nbf: number,
    exp?: number,
    vc: {
        type: string[],
        credentialSubject: {
            fhirBundle: FhirBundle
        },
        rid?: string
    }
}

export type JWSCompact = string;

export interface VerifiableCredential {
    verifiableCredential : Array<JWSCompact>
}

export interface FhirBundle {
    text: string;
    Coding: {display: unknown};
    CodeableConcept: {text: unknown};
    meta: unknown;
    id: unknown;
    resourceType: string,
    type: string,
    entry: BundleEntry[]
}

export type Resource = { 
    resourceType: string, 
    meta? : {security? : unknown[]} 
} & Record<string, unknown>;

export interface BundleEntry {
    id?: string,
    extension?: unknown[],
    modifierExtension?: unknown[],
    link?: string[],
    fullUrl?: string,
    resource: Resource,
    search?: unknown,
    request?: unknown,
    response?: unknown
}

export interface JWK {
    kty: string,
    kid: string,
    use: string,
    alg: string,
    crv: string,
    x: string,
    y: string,
    crlVersion?: number,
    x5c?: Array<string>
}

export interface KeySet {
    keys : Array<JWK>
}

// export interface ValidationResult {
//     shc: string | undefined,
//     jws_compact: string | undefined,
//     jws: JWS | undefined,
//     payload: JWSPayload | undefined,
//     fhirbundle: FhirBundle | undefined,
//     log: Array<LogEntry>,
//     options: IOptions | undefined
//   }

// export interface ValidationResult {
//     shc?: string,
//     jws_compact?: string,
//     jws?: JWS,
//     payload?: JWSPayload,
//     fhirbundle?: FhirBundle ,
//     log: Log,
//     options?: IOptions
//   }
  
// export interface LogEntry {
//     message: string,
//     code: number,
//     artifact: Artifact,
//     fatal: boolean,
//     level: number
// }

// export type Artifact = 'shc' | 'jws' | 'compactjws' | 'fhirbundle' | 'payload' | 'qr';

export interface IOptions {
    loglevel?: number  
    validator?: number; 
    directory?: Directory; 
    keys?: Array<JWK>;
    issuers?: Array<Issuer>;    
}

export interface Issuer {
    iss: string, 
    name: string, 
    website?: string, 
    canonical_iss?: string
}

export interface Directory {
    directory: string,
    time: string,
    issuerInfo: Array<IssuerInfo>
}

export interface IssuerInfo {
    issuer: Issuer,
    keys: Array<JWK>
}

export type FilePath = string;

export type Base64Url = string;