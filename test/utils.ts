import Context from "../src/context";
import { ErrorCode } from "../src/error";
import { LogLevel } from "../src/log";

function checkErrors(context: Context, expected: ErrorCode[][] | ErrorCode[] | ErrorCode = [[], []]): void {

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

    const [actualErrors, actualWarnings] = [
        context.log.entries(LogLevel.ERROR).map(le => `ERROR: ${le.code} ${ErrorCode[le.code]}`),
        context.log.entries(LogLevel.WARNING).filter(le => le.level === LogLevel.WARNING).map(le => `WARNING: ${le.code} ${ErrorCode[le.code]}`)
    ];

    expect(errors.concat(warnings).sort()).toEqual(actualErrors.concat(actualWarnings).sort());
    //expect(warnings.sort()).toEqual(actualWarnings.sort());
}

function toCorruptJson(object: object): string {
    const json = JSON.stringify(object);
    return json.replace(/(\}|\])$/, '');
}

function isIntegerArray(array: any): boolean {
    return array?.every((element: any) => Number.isInteger(element)) === true;
}

export { checkErrors, toCorruptJson };
