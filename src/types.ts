import { LogEntry } from "./log.js";

export interface JWSHeader {
    [x: string]: string;
    alg: string,
    kid: string,
    zip: string
}

export interface JWS {
    header?: JWSHeader,
    payload?: JWSPayload,
    signature?: Uint8Array,
}

export interface JWSFlat {
    header?: Base64Url,
    payload?: Base64Url,
    signature?: Base64Url,
}

export interface JWSPayload {
    iss: string,
    nbf: number,
    exp?: number,
    vc: {
        type: string[],
        credentialSubject: {
            fhirVersion: string,
            fhirBundle: FhirBundle
        },
        rid?: string
    },
    rid?: string
}

export interface VerifiableCredential {
    verifiableCredential: Array<JWSCompact>
}

export interface FhirBundle {
    resourceType: 'Bundle',
    type: 'collection',
    entry: BundleEntry[]
}

export interface Resource {
    resourceType: 'Patient' | 'Immunization',
    meta?: { security?: unknown[] },
}

export interface ImmunizationResource extends Resource {
    resourceType: "Immunization",
    status: "completed",
    vaccineCode: {
        coding: {
            system: string,
            code: string
        }[]
    },
    patient: {
        reference: string
    },
    occurrenceDateTime: string,
    performer: {
        actor: {
            display: string
        }
    }[],

    lotNumber: string
}

export interface PatientResource extends Resource {
    resourceType: "Patient",
    name: {
        family: string,
        given: string[]
    }[],
    birthDate: string
}

export interface BundleEntry {
    id?: string,
    extension?: unknown[],
    modifierExtension?: unknown[],
    link?: string[],
    fullUrl?: string,
    resource: ImmunizationResource | PatientResource,
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
    d?: string,
    crlVersion?: number,
    x5c?: Array<string>
}

export interface KeySet {
    keys: Array<JWK>
}

export interface Options {
    directory?: IDirectory | string | string[] | IDirectory[];
    keys?: Array<JWK>;
    issuers?: Array<Issuer>;
    chain?: boolean,
    encode?: {
        fhirVersion?: string,
        rid?: string,
        nbf?: number,
        iss?: string,
        deflateLevel?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
    },
    privateKey?: JWK,
    reconstructQrCode?: boolean,
    validation?: DirectoryOptions
}

export interface DirectoryOptions {
    key?: {
        computeKid?: boolean,
        allowAdditionalProperties?: boolean
    },
    directory?: {
        allowDuplicates?: boolean
    }
}

export interface Issuer {
    iss: string,
    name: string,
    website?: string,
    canonical_iss?: string
}

export interface IDirectory {
    directory: string,
    time: string,
    issuerInfo: Array<IssuerInfo>
}

export interface IssuerInfo {
    issuer: Issuer,
    keys: Array<JWK>,
    crls?: Array<CRL>,
    lastRetrieved?: string
}

export type JWSCompact = string;

export type Base64Url = string;

export type Base64 = string;

export type ShcNumeric = string;

export type QRUrl = string;

export interface Patient {
    name: string,
    dob: Date
}

export interface Immunization {
    dose: number,
    date: Date,
    manufacturer: string,
    performer: string
}

export interface ImmunizationRecord {
    patient: Patient,
    immunizations: Immunization[]
}

export interface ImmunizationCard extends ImmunizationRecord {
    verified: boolean,
    issuer: string
}

export interface ResultWithErrors<T> {
    result: T | undefined,
    errors?: LogEntry[]
}

export interface CvxCode {
    name: string,
    description: string,
    cvx: number,
    manufacturer: string,
    mvx: string,
    mvxStatus: string,
    status: string,
    updated: Date,
}

export interface CRL {
    kid: string,
    method: string,
    ctr: number,
    rids: string[]
}

export interface SHCInfo {
    kid: string | undefined,
    rid: string | undefined,
    nbf: number | undefined,
    iss: string | undefined,
    exp: number | undefined
}
