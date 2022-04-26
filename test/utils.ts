import Context from "../src/context.js";
import { Directory } from "../src/directory.js";
import { ErrorCode } from "../src/error.js";
import { LogEntry, LogLevel } from "../src/log.js";
import { JWK } from "../src/types.js";
import shc from '../src/shc.js';
import signature from '../src/signature.js';
import flat from '../src/jws.flat.js';

type ExpectedErrors = ErrorCode[][] | ErrorCode[] | ErrorCode;

function checkErrors(context: Context | LogEntry[] | Directory, expected: ExpectedErrors = [[], []], ignore: ErrorCode[] = []): void {

    let _expected: ErrorCode[][];

    if (typeof expected === 'number') {
        _expected = [[expected as ErrorCode], []];
    } else if (isIntegerArray(expected)) {
        _expected = [expected as ErrorCode[], []]
    } else if (expected?.length === 1 && isIntegerArray(expected?.[0])) {
        _expected = [expected as ErrorCode[], []]
    } else if (expected?.length === 0) {
        _expected = [[], []]
    } else {
        _expected = expected as ErrorCode[][];
    }

    let errors = _expected[0].map(code => `ERROR: ${code} ${ErrorCode[code]}`);
    let warnings = _expected[1].map(code => `WARNING: ${code} ${ErrorCode[code]}`);

    if (context instanceof Array) {
        context = {
            errors: context.filter(err => err.level === LogLevel.ERROR),
            warnings: context.filter(err => err.level === LogLevel.WARNING),
        } as Context;
    }

    if (context instanceof Directory) {
        context = {
            errors: context.errors ?? [],
            warnings: context.warnings ?? []
        } as Context;
    }

    let [actualErrors, actualWarnings] = [
        (context.errors ?? []).filter(le => !ignore.includes(le.code)).map(le => `ERROR: ${le.code} ${ErrorCode[le.code]}`),
        (context.warnings ?? []).filter(le => !ignore.includes(le.code)).map(le => `WARNING: ${le.code} ${ErrorCode[le.code]}`)
    ];

    expect(errors.concat(warnings).sort()).toEqual(actualErrors.concat(actualWarnings).sort());
}

function toCorruptJson(object: object): string {
    const json = JSON.stringify(object);
    return json.replace(/(\}|\])$/, '');
}

function isIntegerArray(array: any): boolean {
    return array?.every((element: any) => Number.isInteger(element)) === true;
}

async function modifyAndResign(shcString: string, privateKey: JWK, modify: (context: Context) => void): Promise<Context> {
    const context = new Context({ privateKey });
    context.shc = shcString;
    await shc.decode(context);
    modify(context);
    await signature.sign(context);
    await flat.encode(context);
    return context;
}

export function clone<T>(object: object): T {
    return JSON.parse(JSON.stringify(object));
}

export { checkErrors, toCorruptJson, modifyAndResign as modifyAndSign };
