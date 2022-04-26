import { Directory } from '../src/directory.js'
import { ErrorCode } from '../src/log.js';
import { checkErrors, clone } from "./utils.js";
import { IDirectory} from '../src/types.js';
import { data } from './constants.js';
import { isoDateString } from '../src/utils.js';


var vciDirectory: Directory;
const EC = ErrorCode;


beforeAll(async () => {
    vciDirectory = await Directory.create('vci');
});


const ALLOW_ADDITIONAL = { key: { allowAdditionalProperties: true } };
const IGNORE_KID = { key: { computeKid: false } };


test('directory-create-valid-IDirectory', async () => {
    const dir = await Directory.create([vciDirectory], ALLOW_ADDITIONAL);
    expect(dir.validated).toBe(true);
    checkErrors(dir);
});

test('directory-create-valid-empty', async () => {
    const dir = await Directory.create({ directory: '', time: isoDateString(), issuerInfo: [] });
    expect(dir.validated).toBe(true);
    checkErrors(dir);
});

test('directory-create-valid-duplicate-Directory', async () => {
    const dir = await Directory.create([vciDirectory, vciDirectory, vciDirectory], ALLOW_ADDITIONAL);
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

    // create multipe crls with the same kid and different ctr versions
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

    // create multipe crls; two share the same kid
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

    // create multipe crls; two share the same kid
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
    // however, the directory will be valid for the successfull downloads
    const dir = await Directory.create([
        "https://spec.smarthealth.cards/examples/issuer",
        "https://spec.smarthealth.cards/examples/issuer",
        "https://spec.smarthealth.cards/examples/issuerX"
    ]);
    // the directory validation will fail, but still be valid for the successfull issuers
    expect(dir.validated).toBe(false);
    expect(dir.issuerInfo.length).toBe(1);
    checkErrors(dir, ErrorCode.DOWNLOAD_FAILED);
});

test('directory-create-iss-array-with-one-404-url-and-recreate', async () => {
    // if one of the issuers cannot be download, error(s) will occur.
    // however, the directory will be valid for the successfull downloads
    let dir = await Directory.create([
        "https://spec.smarthealth.cards/examples/issuer",
        "https://spec.smarthealth.cards/examples/issuer",
        "https://spec.smarthealth.cards/examples/issuerX"
    ]);
    // the directory validation will fail, but still be valid for the successfull issuers
    expect(dir.validated).toBe(false);
    expect(dir.issuerInfo.length).toBe(1);
    checkErrors(dir, ErrorCode.DOWNLOAD_FAILED);

    // if we create again, we should have a completely valid directory (minus the failed issuer)
    dir = await Directory.create(dir);
    expect(dir.validated).toBe(true);
    expect(dir.issuerInfo.length).toBe(1);
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

const dir = {
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
