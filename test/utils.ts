// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Context from "../src/context.js";
import { ErrorCode } from "../src/error.js";


type ExpectedErrors = ErrorCode[][] | ErrorCode[] | ErrorCode;

function checkErrors(context: Context, expected: ExpectedErrors = [[], []], ignore: ErrorCode[] = []): void {

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

export { checkErrors, toCorruptJson };
