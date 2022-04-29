import Context from "./context.js";
import { ErrorCode } from "./error.js";

enum LogLevel {
    DEBUG,
    INFO,
    WARNING,
    ERROR
}

export interface LogEntry {
    message: string,
    code: number,
    label: string,
    fatal: boolean,
    level: number
}

class Log {

    #entries: Array<LogEntry>;
    #label: string;
    #parent: Context;

    constructor(context: Context) {
        this.#label = '';
        this.#entries = [];
        this.#parent = context;
    }

    // is one of the errors fatal? (fatal error stops the decoding/validation process)
    get isFatal() {
        return this.#entries.some(e => e.fatal);
    }

    set label(label: string) {
        this.#label = label;
    }

    add(log: Log): Context;
    add(message: string, level: LogLevel, code?: ErrorCode, fatal?: boolean): Context;
    add(logItem: string | Log, level: LogLevel = LogLevel.ERROR, code: ErrorCode = ErrorCode.NOERROR, fatal: boolean = false): Context {

        if (logItem instanceof Log) {
            this.#entries = this.#entries.concat(logItem.entries());
        } else {
            this.#entries.push({ message: logItem, code, fatal, level, label: this.#label });
        }
        return this.#parent;
    }

    // get all items at the specified logLevel and above (e.g. 'info' will return info, warnings, and errors)
    entries = (level: LogLevel = LogLevel.WARNING): Array<LogEntry> => this.#entries.filter(e => e.level >= level);

    debug = (message: string): Context => this.add(message, LogLevel.DEBUG);
    info = (message: string): Context => this.add(message, LogLevel.INFO);
    warn = (message: string, code: ErrorCode = ErrorCode.ERROR): Context => this.add(message, LogLevel.WARNING, code);
    error = (message: string, code: ErrorCode = ErrorCode.ERROR, fatal: boolean = false): Context => this.add(message, LogLevel.ERROR, code, fatal);
    fatal = (message: string, code: ErrorCode = ErrorCode.ERROR): Context => this.add(message, LogLevel.ERROR, code, true);

    clear = () => { this.#entries = [] };

    //
    // Customize JSON.stringify() output
    //
    toJSON = () => {
        return this;
    };

    //
    // Customize toString() output
    //
    toString = () => {
        return JSON.stringify(this);
    };


    public static logEntry(message: string, code: ErrorCode = ErrorCode.ERROR, level: LogLevel = LogLevel.ERROR, label: string = '', fatal: boolean = false): LogEntry {
        return {
            code,
            message,
            level,
            label,
            fatal
        };
    }

}

export { LogLevel, ErrorCode, Log };
