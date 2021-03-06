import { Directory } from '../src/directory.js'
import { ErrorCode } from '../src/log.js';
import { checkErrors, clone } from "./utils.js";
import { IDirectory, JWK } from '../src/types.js';
import { data } from './constants.js';
import { isoDateString } from '../src/utils.js';


var vciDirectory: Directory;
const EC = ErrorCode;


beforeAll(async () => {
    vciDirectory = await Directory.create('vci');
});


const ALLOW_ADDITIONAL = { key: { allowAdditionalProperties: true } };
const IGNORE_KID = { key: { computeKid: false } };
const IGNORE_BAD_KEY_ALG = { key: { filterBadKeys: true } };
const VCI_EXCEPTIONS = { key: { filterBadKeys: true, allowAdditionalProperties: true } };

test('directory-create-valid-IDirectory', async () => {
    const dir = await Directory.create([vciDirectory], VCI_EXCEPTIONS);
    expect(dir.validated).toBe(true);
    checkErrors(dir);
});

test('directory-create-valid-empty', async () => {
    const dir = await Directory.create({ directory: '', time: isoDateString(), issuerInfo: [] });
    expect(dir.validated).toBe(true);
    checkErrors(dir);
});

test('directory-create-valid-duplicate-Directory', async () => {
    const dir = await Directory.create([vciDirectory, vciDirectory, vciDirectory], VCI_EXCEPTIONS);
    expect(dir.validated).toBe(true);
    expect(dir.issuerInfo.length).toBe(vciDirectory.issuerInfo.length);
    checkErrors(dir);
});

test('directory-create-valid-duplicate-IDirectory', async () => {
    const dir = await Directory.create([data.directoryWithCrl, data.directoryWithCrl, data.directoryWithCrl], ALLOW_ADDITIONAL);
    expect(dir.validated).toBe(true);
    expect(dir.issuerInfo.length).toBe(data.directoryWithCrl.issuerInfo.length);
    checkErrors(dir);
});

test('directory-create-bad-input-empty', async () => {
    const dir = await Directory.create();
    expect(dir.validated).toBe(true);
    expect(dir.issuerInfo.length).toBe(0);
    checkErrors(dir);
});

test('directory-create-bad-input-empty-array', async () => {
    const dir = await Directory.create([]);
    expect(dir.validated).toBe(true);
    expect(dir.issuerInfo.length).toBe(0);
    checkErrors(dir);
});

test('directory-create-bad-input-empty-undefined', async () => {
    const dir = await Directory.create(undefined);
    expect(dir.validated).toBe(true);
    expect(dir.issuerInfo.length).toBe(0);
    checkErrors(dir);
});

test('directory-create-bad-input-empty-null', async () => {
    const dir = await Directory.create(null as unknown as undefined);
    expect(dir.validated).toBe(true);
    expect(dir.issuerInfo.length).toBe(0);
    checkErrors(dir);
});

test('directory-create-bad-input-empty-NaN', async () => {
    const dir = await Directory.create(NaN as unknown as undefined);
    expect(dir.validated).toBe(false);
    checkErrors(dir, [ErrorCode.PARAMETER_INVALID]);
});

test('directory-create-bad-input-empty-string', async () => {
    const dir = await Directory.create('');
    expect(dir.validated).toBe(false);
    checkErrors(dir, [ErrorCode.PARAMETER_INVALID]);
});

test('directory-create-bad-input-true', async () => {
    const dir = await Directory.create(true as unknown as undefined);
    expect(dir.validated).toBe(false);
    checkErrors(dir, [ErrorCode.PARAMETER_INVALID]);
});

test('directory-create-bad-input-false', async () => {
    const dir = await Directory.create(false as unknown as undefined);
    expect(dir.validated).toBe(false);
    checkErrors(dir, [ErrorCode.PARAMETER_INVALID]);
});

test('directory-create-bad-input-empty-object', async () => {
    const dir = await Directory.create({} as unknown as undefined);
    expect(dir.validated).toBe(false);
    checkErrors(dir, [ErrorCode.PARAMETER_INVALID]);
});

test('directory-create-bad-input-Date', async () => {
    const dir = await Directory.create(new Date() as unknown as undefined);
    expect(dir.validated).toBe(false);
    checkErrors(dir, [ErrorCode.PARAMETER_INVALID]);
});

test('directory-create-bad-malformed-IDirectory-issuerInfo-undefined', async () => {
    const dir = await Directory.create({ issuerInfo: undefined } as unknown as IDirectory);
    expect(dir.validated).toBe(false);
    checkErrors(dir, [ErrorCode.PARAMETER_INVALID]);
});

test('directory-create-bad-malformed-IDirectory-issuerInfo-null', async () => {
    const dir = await Directory.create({ issuerInfo: null } as unknown as IDirectory);
    expect(dir.validated).toBe(false);
    checkErrors(dir, [ErrorCode.PARAMETER_INVALID]);
});

test('directory-create-bad-malformed-IDirectory-issuerInfo-object', async () => {
    const dir = await Directory.create({ issuerInfo: {} } as unknown as IDirectory);
    expect(dir.validated).toBe(false);
    checkErrors(dir, [ErrorCode.PARAMETER_INVALID]);
});

test('directory-create-bad-malformed-IDirectory-issuerInfo-string', async () => {
    const dir = await Directory.create({ issuerInfo: '' } as unknown as IDirectory);
    expect(dir.validated).toBe(false);
    checkErrors(dir, [ErrorCode.PARAMETER_INVALID]);
});

test('directory-create-iss-array-with-one-bad-url', async () => {
    const dir = await Directory.create([
        "https://spec.smarthealth.cards/examples/issuer",
        "https://spec.smarthealth.cards/examples/issuer",
        "foo"
    ]);
    expect(dir.validated).toBe(false);
    checkErrors(dir, [ErrorCode.PARAMETER_INVALID]);
});

test('directory-merge-duplicate-crls', async () => {
    const iDir = clone<IDirectory>(data.directoryWithCrl);
    iDir.issuerInfo[0].crls!.concat(iDir.issuerInfo[0].crls![0]);
    const dir = await Directory.create(iDir);
    expect(dir.validated).toBe(true);
    expect(dir.issuerInfo[0].crls!.length === 1).toBe(true);
    checkErrors(dir);
});

test('directory-merge-duplicate-crls-filter-out-old', async () => {
    const iDir = clone<IDirectory>(data.directoryWithCrl);

    // create multiple crls with the same kid and different ctr versions
    let crls = iDir.issuerInfo[0].crls!;
    crls.push(clone(crls[0]), clone(crls[0]));
    crls[1].ctr = 3;
    crls[2].ctr = 1;
    iDir.issuerInfo[0].crls = crls;

    const dir = await Directory.create(iDir);

    // only the crl with the highest version should remain
    expect(dir.validated).toBe(true);
    expect(dir.issuerInfo[0].crls!.length).toBe(1);
    expect(dir.issuerInfo[0].crls![0].ctr).toBe(3);
    checkErrors(dir);
});

test('directory-merge-duplicate-crls-dont-filter', async () => {
    const iDir = clone<IDirectory>(data.directoryWithCrl);

    // create multiple crls; two share the same kid
    let crls = iDir.issuerInfo[0].crls!;
    crls.push(clone(crls[0]), clone(crls[0]));
    crls[1].kid = crls[0].kid;
    crls[2].kid = crls[0].kid + '1';
    iDir.issuerInfo[0].crls = crls;

    const dir = await Directory.create(iDir);

    // only the two crls with unique kids should remain
    expect(dir.validated).toBe(true);
    expect(dir.issuerInfo[0].crls!.length).toBe(2);
    expect(dir.issuerInfo[0].crls![0].kid).toBe(crls[0].kid + '1');
    checkErrors(dir, [[], [EC.CRL_NO_MATCHING_KEYS_KID]]);
});

test('directory-merge-duplicate-rids-filter-out-oldest', async () => {
    const iDir = clone<IDirectory>(data.directoryWithCrl);

    // create multiple crls; two share the same kid
    let crls = iDir.issuerInfo[0].crls!;
    crls.push(clone(crls[0]), clone(crls[0]));
    crls[1].kid = crls[0].kid;
    crls[2].kid = crls[0].kid + '1';
    iDir.issuerInfo[0].crls = crls;

    const dir = await Directory.create(iDir);

    // only the two crls with unique kids should remain
    expect(dir.validated).toBe(true);
    expect(dir.issuerInfo[0].crls!.length).toBe(2);
    expect(dir.issuerInfo[0].crls![0].kid).toBe(crls[0].kid + '1');
    checkErrors(dir, [[], [EC.CRL_NO_MATCHING_KEYS_KID]]);
});

test('directory-merge-duplicate-of-different-kinds', async () => {
    const dir = await Directory.create(dirWithDuplicates, IGNORE_KID);
    expect(dir.validated).toBe(true);
    checkErrors(dir);
    expect(dir.export()).toMatchObject({ ...dirWithDuplicatesMerged });
});

test('directory-merge-iss-array-with-duplicates', async () => {
    const dir = await Directory.create([
        "https://spec.smarthealth.cards/examples/issuer",
        "https://spec.smarthealth.cards/examples/issuer"
    ]);
    expect(dir.validated).toBe(true);
    expect(dir.issuerInfo.length).toBe(1);
    expect(dir.issuerInfo[0].issuer.iss).toBe("https://spec.smarthealth.cards/examples/issuer");
    checkErrors(dir);
});

test('directory-create-iss-array-with-one-404-url', async () => {
    // if one of the issuers cannot be download, error(s) will occur.
    // however, the directory will be valid for the successful downloads
    const dir = await Directory.create([
        "https://spec.smarthealth.cards/examples/issuer",
        "https://spec.smarthealth.cards/examples/issuer",
        "https://spec.smarthealth.cards/examples/issuerX"
    ]);
    // the directory validation will fail, but still be valid for the successful issuers
    expect(dir.validated).toBe(false);
    expect(dir.issuerInfo.length).toBe(1);
    checkErrors(dir, ErrorCode.DOWNLOAD_FAILED);
});

test('directory-create-iss-array-with-one-404-url-and-recreate', async () => {
    // if one of the issuers cannot be download, error(s) will occur.
    // however, the directory will be valid for the successful downloads
    let dir = await Directory.create([
        "https://spec.smarthealth.cards/examples/issuer",
        "https://spec.smarthealth.cards/examples/issuer",
        "https://spec.smarthealth.cards/examples/issuerX"
    ]);
    // the directory validation will fail, but still be valid for the successful issuers
    expect(dir.validated).toBe(false);
    expect(dir.issuerInfo.length).toBe(1);
    checkErrors(dir, ErrorCode.DOWNLOAD_FAILED);

    // if we create again, we should have a completely valid directory (minus the failed issuer)
    dir = await Directory.create(dir);
    expect(dir.validated).toBe(true);
    expect(dir.issuerInfo.length).toBe(1);
    checkErrors(dir);
});

test('directory-update-by-iss', async () => {
    const iss = "https://spec.smarthealth.cards/examples/issuer";
    let dir = await Directory.create({
        directory: iss,
        time: isoDateString(),
        issuerInfo: [{
            issuer: { iss: iss, name: 'foo' },
            keys: [] as JWK[],
            lastRetrieved: "2022-04-14T04:39:51Z"
        }]
    } as IDirectory);
    const now = Date.now() - 1000;

    let issuer = dir.find(iss);
    let lastUpdated = new Date(issuer!.lastRetrieved as string).getTime();
    expect(lastUpdated).toBeLessThan(now);

    const result = await dir.update(iss);
    expect(result).toBe(true);

    issuer = dir.find(iss);
    lastUpdated = new Date(issuer!.lastRetrieved as string).getTime();

    expect(lastUpdated).toBeGreaterThan(now);
    expect(dir.export().issuerInfo[0]).toMatchObject({ ...smartExampleDir.issuerInfo[0], lastRetrieved: issuer!.lastRetrieved });
    checkErrors(dir);
});

test('directory-update-by-date', async () => {
    const iss = "https://spec.smarthealth.cards/examples/issuer";
    let dir = await Directory.create({
        directory: iss,
        time: isoDateString(),
        issuerInfo: [{
            issuer: { iss: iss, name: 'foo' },
            keys: [] as JWK[],
            lastRetrieved: "2022-04-14T04:39:51Z"
        }]
    } as IDirectory);
    const now = Date.now() - 1000;

    let issuer = dir.find(iss);
    let lastUpdated = new Date(issuer!.lastRetrieved as string).getTime();
    expect(lastUpdated).toBeLessThan(now);

    const updateDate = new Date("2022-04-14T04:39:52Z"); // +1 second
    const result = await dir.update(updateDate);
    expect(result).toBe(true);

    issuer = dir.find(iss);
    lastUpdated = new Date(issuer!.lastRetrieved as string).getTime();

    expect(lastUpdated).toBeGreaterThan(now);
    expect(dir.export().issuerInfo[0]).toMatchObject({ ...smartExampleDir.issuerInfo[0], lastRetrieved: issuer!.lastRetrieved });
    checkErrors(dir);
});


const dirWithDuplicates: IDirectory[] = [
    {
        directory: "https://spec.smarthealth.cards/examples",
        time: "2022-02-28T22:38:31Z",
        issuerInfo: [
            {
                issuer: {
                    iss: 'https://spec.smarthealth.cards/examples/issuer',
                    name: 'smarthealth.cards'
                },
                keys: [
                    {
                        kty: "EC",
                        kid: "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                        use: "sig",
                        alg: "ES256",
                        crv: "P-256",
                        x: "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw",
                        y: "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8",
                        crlVersion: 3
                    }
                ],
                crls: [{
                    kid: "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                    method: "rid",
                    ctr: 3,
                    rids: [
                        "MKyCxh7p6uQ.1643950799",
                        "MKyCxh7p6uQ",
                    ]
                }],
                lastRetrieved: isoDateString()
            },
            {
                issuer: {
                    iss: 'https://spec.smarthealth.cards/examples/issuer',
                    name: 'smarthealth.cardsA',
                    website: 'www.smarthealth.cards'
                },
                keys: [
                    {
                        kty: "EC",
                        kid: "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                        use: "sig",
                        alg: "ES256",
                        crv: "P-256",
                        x: "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw",
                        y: "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8",
                        crlVersion: 1
                    },
                    {
                        kty: "EC",
                        kid: "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                        use: "sig",
                        alg: "ES256",
                        crv: "P-256",
                        x: "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw",
                        y: "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8",
                        crlVersion: 2
                    }
                ],
                crls: [{
                    kid: "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                    method: "rid",
                    ctr: 1,
                    rids: [
                        "MKyCxh7p6uQ.1643950799",
                        "MKyCxh7p6uQ",
                    ]
                }],
                lastRetrieved: isoDateString()
            }
        ]
    },
    {
        directory: "https://spec.smarthealth.cards/examples",
        time: "2022-02-28T22:38:31Z",
        issuerInfo: [
            {
                issuer: {
                    iss: 'https://spec.smarthealth.cards/examples/issuer',
                    name: 'smarthealth.cardsB',
                    canonical_iss: 'https://spec.smarthealth.cards/examples/issuer'
                },
                keys: [
                    {
                        kty: "EC",
                        kid: "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                        use: "sig",
                        alg: "ES256",
                        crv: "P-256",
                        x: "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw",
                        y: "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8"
                    },
                    {
                        kty: "EC",
                        kid: "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                        use: "sig",
                        alg: "ES256",
                        crv: "P-256",
                        x: "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw",
                        y: "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8",
                        crlVersion: 4
                    },
                    {
                        kty: "EC",
                        kid: "4Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                        use: "sig",
                        alg: "ES256",
                        crv: "P-256",
                        x: "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw",
                        y: "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8",
                        crlVersion: 2
                    }
                ],
                crls: [
                    {
                        kid: "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                        method: "rid",
                        ctr: 2,
                        rids: [
                            "MKyCxh7p6uQ.1643950801"
                        ]
                    },
                    {
                        kid: "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                        method: "rid",
                        ctr: 3,
                        rids: [
                            "MKyCxh7p6uQ.1643950801",
                            "MKyCxh7p6uH",
                        ]
                    }
                ],
                lastRetrieved: isoDateString()
            }
        ]
    }
];

const dirWithDuplicatesMerged: IDirectory = {
    directory: "https://spec.smarthealth.cards/examples",
    time: "2022-02-28T22:38:31Z",
    issuerInfo: [
        {
            issuer: {
                iss: "https://spec.smarthealth.cards/examples/issuer",
                name: "smarthealth.cards",
                canonical_iss: "https://spec.smarthealth.cards/examples/issuer",
                website: "www.smarthealth.cards"
            },
            keys: [
                {
                    kty: "EC",
                    kid: "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                    use: "sig",
                    alg: "ES256",
                    crv: "P-256",
                    x: "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw",
                    y: "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8",
                    crlVersion: 4
                },
                {
                    kty: "EC",
                    kid: "4Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                    use: "sig",
                    alg: "ES256",
                    crv: "P-256",
                    x: "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw",
                    y: "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8",
                    crlVersion: 2
                }
            ],
            crls: [
                {
                    kid: "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                    method: "rid",
                    ctr: 3,
                    rids: [
                        "MKyCxh7p6uH",
                        "MKyCxh7p6uQ"
                    ]
                }
            ]
        }
    ]
};

const smartExampleDir = {
    "directory": "https://spec.smarthealth.cards/examples/issuer",
    "time": "2022-04-28T02:32:26Z",
    "issuerInfo": [
        {
            "issuer": {
                "iss": "https://spec.smarthealth.cards/examples/issuer",
                "name": "foo"
            },
            "keys": [
                {
                    "kty": "EC",
                    "kid": "EBKOr72QQDcTBUuVzAzkfBTGew0ZA16GuWty64nS-sw",
                    "use": "sig",
                    "alg": "ES256",
                    "x5c": [
                        "MIICDDCCAZGgAwIBAgIUVJEUcO5ckx9MA7ZPjlsXYGv+98wwCgYIKoZIzj0EAwMwJzElMCMGA1UEAwwcU01BUlQgSGVhbHRoIENhcmQgRXhhbXBsZSBDQTAeFw0yMTA2MDExNTUwMDlaFw0yMjA2MDExNTUwMDlaMCsxKTAnBgNVBAMMIFNNQVJUIEhlYWx0aCBDYXJkIEV4YW1wbGUgSXNzdWVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEPQHApUWm94mflvswQgAnfHlETMwJFqjUVSs7WU6LQy7uaPwg77xXlVmMNtFWwkg0L9GrlqLkIOEVfXxx5GwtZKOBljCBkzAJBgNVHRMEAjAAMAsGA1UdDwQEAwIHgDA5BgNVHREEMjAwhi5odHRwczovL3NwZWMuc21hcnRoZWFsdGguY2FyZHMvZXhhbXBsZXMvaXNzdWVyMB0GA1UdDgQWBBTGqQP/SGBzOjWWcDdk/U7bQFhu+DAfBgNVHSMEGDAWgBQ4uufUcLGAmR55HWQWi+6PN9HJcTAKBggqhkjOPQQDAwNpADBmAjEAlZ9TR2TJnhumSUmtmgsWPpcp3xDYUtcXtxHs2xuHU6HqoaBfWDdUJKO8tWljGSVWAjEApesQltBP8ddWIn1BgBpldJ1pq9zukqfwRjwoCH1SRQXyuhGNfovvQMl/lw8MLIyO",
                        "MIICBzCCAWigAwIBAgIUK9wvDGYJ5S9DKzs/MY+IiTa0CP0wCgYIKoZIzj0EAwQwLDEqMCgGA1UEAwwhU01BUlQgSGVhbHRoIENhcmQgRXhhbXBsZSBSb290IENBMB4XDTIxMDYwMTE1NTAwOVoXDTI2MDUzMTE1NTAwOVowJzElMCMGA1UEAwwcU01BUlQgSGVhbHRoIENhcmQgRXhhbXBsZSBDQTB2MBAGByqGSM49AgEGBSuBBAAiA2IABF2eAAAAGv0/isod1xpgaLX0DASxCDs0+JbCt12CTdQhB7os9m9H8c0nLyaNb8lM9IXkBRZLoLly/ZRaRjU8vq3bt6l5m9Cc6OY+xwmADKvNdNm94dsCC5CiB+JQu6WgWKNQME4wDAYDVR0TBAUwAwEB/zAdBgNVHQ4EFgQUOLrn1HCxgJkeeR1kFovujzfRyXEwHwYDVR0jBBgwFoAUJo6aEvlKNnmPfQaKVkOXIDY87/8wCgYIKoZIzj0EAwQDgYwAMIGIAkIBq9tT76Qzv1wH6nB0/sKPN4xPUScJeDv4+u2Zncv4ySWn5BR3DxYxEdJsVk4Aczw8uBipnYS90XNiogXMmN7JbRQCQgEYLzjOB1BdWIzjBlLF0onqnsAQijr6VX+2tfd94FNgMxHtaU864vgD/b3b0jr/Qf4dUkvF7K9WM1+vbcd0WDP4gQ==",
                        "MIICMjCCAZOgAwIBAgIUadiyU9sUFV6H40ZB5pCyc+gOikgwCgYIKoZIzj0EAwQwLDEqMCgGA1UEAwwhU01BUlQgSGVhbHRoIENhcmQgRXhhbXBsZSBSb290IENBMB4XDTIxMDYwMTE1NTAwOFoXDTMxMDUzMDE1NTAwOFowLDEqMCgGA1UEAwwhU01BUlQgSGVhbHRoIENhcmQgRXhhbXBsZSBSb290IENBMIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQB/XU90B0DMB6GKbfNKz6MeEIZ2o6qCX76GGiwhPYZyDLgB4+njRHUA7l7KSrv8THtzXSn8FwDmubAZdbU3lwNRGcAQJVY/9Bq9TY5Utp8ttbVnXcHQ5pumzMgIkkrIzERg+iCZLtjgPYjUMgeLWpqQMG3VBNN6LXN4wM6DiJiZeeBId6jUDBOMAwGA1UdEwQFMAMBAf8wHQYDVR0OBBYEFCaOmhL5SjZ5j30GilZDlyA2PO//MB8GA1UdIwQYMBaAFCaOmhL5SjZ5j30GilZDlyA2PO//MAoGCCqGSM49BAMEA4GMADCBiAJCAe/u808fhGLVpgXyg3h/miSnqxGBx7Gav5Xf3iscdZkF9G5SH1G6UPvIS0tvP/2x9xHh2Vsx82OCZH64uPmKPqmkAkIBcUed8q/dQMgUmsB+jT7A7hKz0rh3CvmhW8b4djD3NesKW3M9qXqpRihd+7KqmTjUxhqUckiPBVLVm5wenaj08Ys="
                    ],
                    "crv": "P-256",
                    "x": "PQHApUWm94mflvswQgAnfHlETMwJFqjUVSs7WU6LQy4",
                    "y": "7mj8IO-8V5VZjDbRVsJINC_Rq5ai5CDhFX18ceRsLWQ"
                },
                {
                    "kty": "EC",
                    "kid": "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                    "use": "sig",
                    "alg": "ES256",
                    "crv": "P-256",
                    "x": "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw",
                    "y": "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8",
                    "crlVersion": 1
                }
            ],
            "crls": [
                {
                    "kid": "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                    "method": "rid",
                    "ctr": 1,
                    "rids": [
                        "vwAjHdarZuc.1646083020",
                        "FKDIxsTCGlU",
                        "XkNHp2Iyk0Y.1646083020",
                        "TqB_qu_6OtM"
                    ]
                }
            ],
            "lastRetrieved": "2022-04-28T02:32:26Z"
        }
    ]
};
