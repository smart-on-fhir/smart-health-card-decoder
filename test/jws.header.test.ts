import validator from '../src/index';
import { ErrorCode } from "../src/error";
import { LogLevel } from '../src/log';
import { JWSHeader } from '../src/types';

test('header-decode-valid', async () => {
    const result = await validator.decode['header']('eyJ6aXAiOiJERUYiLCJhbGciOiJFUzI1NiIsImtpZCI6ImRNT1ViNW92dE1JYnNXU1czVU1la2ZZWFpidGgzc3J3WlNLQ3plYjBRdzAifQ');
    const errors = result.log.entries( /* warnings + errors (by default) */);
    expect(errors.length).toBe(0);
    expect(result?.jws?.header).toBeDefined();
});

test('header-not-base64url', async () => {
    const result = await validator.decode['header']('eyJ6aXAiOiJERUYiLCJhbGciOiJFUzI1NiIsImtpZCI6ImRNT1ViNW92dE1JYnNXU1czVU1la2ZZWFpidGgzc3J3WlNLQ3plYjBRdzAifQ+');
    const errors = result.log.entries( /* warnings + errors (by default) */);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe(ErrorCode.JWS_HEADER_DECODE_FAIL);
});

test('header-as-number', async () => {
    const result = await validator.decode['header'](0 as unknown as string);
    const errors = result.log.entries( /* warnings + errors (by default) */);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe(ErrorCode.JWS_HEADER_DECODE_FAIL);
});
