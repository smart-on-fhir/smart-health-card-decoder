import { Log, LogEntry, LogLevel } from "./log";
import { FhirBundle, Options, Issuer, JWK, JWS, JWSCompact, JWSFlat, QRUrl, ShcNumeric } from "./types";

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
}

export default Context;