import { data } from './constants.js';
import Context from '../src/context.js';
import { ErrorCode } from '../src/error.js';
import keyValidator from '../src/key.js';
import { JWK } from '../src/types.js';
import { checkErrors } from './utils.js';

let context = new Context();

test('key-validate-valid', async () => {
    const key = { ...data.publicKey };
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context);
    expect(result).toBe(true);
});

test('key-validate-missing-x', async () => {
    const key = { ...data.publicKey };
    delete (key as Partial<JWK>).x;
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, [ErrorCode.JWK_INVALID_PROPERTY]);
    expect(result).toBe(false);
});

test('key-validate-missing-y', async () => {
    const key = { ...data.publicKey };
    delete (key as Partial<JWK>).y;
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, [ErrorCode.JWK_INVALID_PROPERTY]);
    expect(result).toBe(false);
});

test('key-validate-missing-kid', async () => {
    const key = { ...data.publicKey };
    delete (key as Partial<JWK>).kid;
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, [ErrorCode.JWK_INVALID_PROPERTY]);
    expect(result).toBe(false);
});

test('key-validate-missing-kty', async () => {
    const key = { ...data.publicKey };
    delete (key as Partial<JWK>).kty;
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, [ErrorCode.JWK_INVALID_PROPERTY]);
    expect(result).toBe(false);
});

test('key-validate-missing-use', async () => {
    const key = { ...data.publicKey };
    delete (key as Partial<JWK>).use;
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, [ErrorCode.JWK_INVALID_PROPERTY]);
    expect(result).toBe(false);
});

test('key-validate-missing-alg', async () => {
    const key = { ...data.publicKey };
    delete (key as Partial<JWK>).alg;
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, [ErrorCode.JWK_INVALID_PROPERTY]);
    expect(result).toBe(false);
});

test('key-validate-missing-crv', async () => {
    const key = { ...data.publicKey };
    delete (key as Partial<JWK>).crv;
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, [ErrorCode.JWK_INVALID_PROPERTY]);
    expect(result).toBe(false);
});

test('key-validate-wrong-kty', async () => {
    const key = { ...data.publicKey, kty: 'RS' };
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, [ErrorCode.JWK_INVALID_PROPERTY]);
    expect(result).toBe(false);
});

test('key-validate-wrong-use', async () => {
    const key = { ...data.publicKey, use: 'enc' };
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, [ErrorCode.JWK_INVALID_PROPERTY]);
    expect(result).toBe(false);
});

test('key-validate-wrong-alg', async () => {
    const key = { ...data.publicKey, alg: 'SHA-256' };
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, [ErrorCode.JWK_INVALID_PROPERTY]);
    expect(result).toBe(false);
});

test('key-validate-wrong-crv', async () => {
    const key = { ...data.publicKey, crv: 'P-384' };
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, [ErrorCode.JWK_INVALID_PROPERTY]);
    expect(result).toBe(false);
});

test('key-validate-public-with-d', async () => {
    const key = { ...data.privateKey };
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, [[ErrorCode.JWK_INVALID_PROPERTY], [ErrorCode.JWK_UNEXPECTED_PROPERTY]]);
    expect(result).toBe(false);
});

test('key-validate-private-without-d', async () => {
    const key = { ...data.publicKey };
    const result = await keyValidator.validate.key(key, true, context = new Context());
    checkErrors(context, [ErrorCode.JWK_INVALID_PROPERTY]);
    expect(result).toBe(false);
});

test('key-validate-empty', async () => {
    const key = {} as JWK;
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, (new Array(7) as ErrorCode[]).fill(ErrorCode.JWK_INVALID_PROPERTY));
    expect(result).toBe(false);
});

test('key-validate-undefined', async () => {
    const key = undefined as unknown as JWK;
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, [ErrorCode.PARAMETER_INVALID]);
    expect(result).toBe(false);
});

test('key-validate-null', async () => {
    const key = null as unknown as JWK;
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, [ErrorCode.PARAMETER_INVALID]);
    expect(result).toBe(false);
});

test('key-validate-string', async () => {
    const key = '' as unknown as JWK;
    const result = await keyValidator.validate.key(key, false, context = new Context());
    checkErrors(context, [ErrorCode.PARAMETER_INVALID]);
    expect(result).toBe(false);
});
