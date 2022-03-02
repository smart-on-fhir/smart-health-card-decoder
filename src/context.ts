import { Log } from "./log";
import { FhirBundle, IOptions, JWS, JWSPayload } from "./types";

class ValidationContext {

    public qr?: string;
    public shc?: string;
    public jwscompact?: string;
    public jws?: JWS;
    public payload?: JWSPayload;
    public fhirbundle?: FhirBundle;
    public log: Log;
    public options: IOptions = {};
    public signature?: {
        iss: string,
        name: string,
        kid: string,
        verified: boolean
    }

    constructor(log: Log, options: IOptions = {}) {
        this.log = log;
        this.options = options;
    }
}

export default ValidationContext;