import { ErrorCode } from "./error";

enum Artifact {
    NONE = -1,
    QR = 0,
    SHC,
    COMPACTJWS,
    JWS,
    PAYLOAD,
    FHIRBUNDLE
}

enum LogLevel {
    DEBUG,
    INFO,
    WARNING,
    ERROR
}

interface LogEntry {
    message: string,
    code: number,
    artifact: Artifact,
    fatal: boolean,
    level: number
}

class Log {

    #entries: Array<LogEntry>;
    #artificat: Artifact;

    constructor() {
        this.#artificat = Artifact.NONE;
        this.#entries = [];
    }

    // is one of the errors fatal? (fatal error stops the decoding/validation process)
    get isFatal() {
        return this.#entries.some(e => e.fatal);
    }

    set artifact(artificat: Artifact) {
        this.#artificat = artificat;
    }

    add(log: Log): Log;
    add(message: string, level: LogLevel, code?: ErrorCode, fatal?: boolean): Log;
    add(logItem: string | Log, level: LogLevel = LogLevel.ERROR, code: ErrorCode = ErrorCode.NOERROR, fatal: boolean = false): Log {

        if (logItem instanceof Log) {
            this.#entries = this.#entries.concat(logItem.entries());
        } else {
            this.#entries.push({ message: logItem, code, fatal, level, artifact: this.#artificat });
        }
        return this;
    }

    // get all items at the specified logLevel and above (e.g. 'info' will return info, warnings, and errors)
    entries = (level: LogLevel = LogLevel.WARNING): Array<LogEntry> => this.#entries.filter(e => e.level >= level);

    debug = (message: string): Log => this.add(message, LogLevel.DEBUG);
    info = (message: string): Log => this.add(message, LogLevel.INFO);
    warn = (message: string, code: ErrorCode = ErrorCode.ERROR): Log => this.add(message, LogLevel.WARNING, code);
    error = (message: string, code: ErrorCode = ErrorCode.ERROR, fatal: boolean = false): Log => this.add(message, LogLevel.ERROR, code, fatal);
    fatal = (message: string, code: ErrorCode = ErrorCode.ERROR): Log => this.add(message, LogLevel.ERROR, code, true);

    //
    // Customize JSON.stringify() output
    //
    toJSON = ()=>{
        return this;
    };

    //
    // Customize toString() output
    //
    toString = ()=>{
        return JSON.stringify(this);
    };

}

export { Artifact, LogLevel, ErrorCode, Log };