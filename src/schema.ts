// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// import Ajv from 'ajv';
// const ajv = new Ajv({ allErrors: true });
// import ajv_errors from 'ajv-errors';
// ajv_errors(ajv);



const jwkSchema = {
    type: "object",
    properties: {
        kty: { const: "EC" },
        kid: { type: "string", pattern: "^[0-9A-Za-z_\\-]{2,}$" },
        use: { const: "sig" },
        alg: { const: "ES256" },
        crv: { const: "P-256" },
        x: { type: "string", pattern: "^[0-9A-Za-z_\\-]{2,}$" },
        y: { type: "string", pattern: "^[0-9A-Za-z_\\-]{2,}$" },
        crlVersion: { type: "string" },
        x5c: { type: "string" },
    },
    required: ["kid", "alg", "crv", "x", "y"],
    additionalProperties: true,
    errorMessage: {
        type: "should be an object", 
        required: {
            alg: "should have value 'ES256'",
            kid: 'should be base64url encoded string',
        },
        properties: {
            alg: "should have value 'ES256'",
            kid: 'should be base64url encoded string',
        },
    },
};


//const parse = ajv.compile(jwkSchema);

export default jwkSchema;
