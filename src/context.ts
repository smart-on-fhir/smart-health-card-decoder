// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Log, LogEntry, LogLevel } from "./log.js";
import { FhirBundle, Options, Issuer, JWK, JWS, JWSCompact, JWSFlat, QRUrl, ShcNumeric, ImmunizationCard } from "./types.js";

class Context {

    // decode only 
    public qr: QRUrl | undefined;

    // encode/decode
    public shc: ShcNumeric | undefined;
    public compact: JWSCompact | undefined;
    public flat: JWSFlat;

    // encode only
    public jws: JWS;

    // just a pointer into jws
    public fhirbundle?: FhirBundle;

    public signature?: {
        issuer: Issuer,
        key: JWK,
        verified: boolean
    }

    public log: Log;
    public options: Options = {};

    constructor(options: Options = {}) {
        this.log = new Log(this);
        this.options = options;
        this.jws = {} as JWS;
        this.flat = { header: '', payload: '', signature: '' } as JWSFlat;
    }

    get errors(): LogEntry[] | undefined {
        const errors = this.log.entries(LogLevel.ERROR);
        return errors.length ? errors : undefined;
    }

    get warnings(): LogEntry[] | undefined {
        const warnings = this.log.entries(LogLevel.WARNING).filter(le => le.level === LogLevel.WARNING);
        return warnings.length ? warnings : undefined;
    }

}

export default Context;