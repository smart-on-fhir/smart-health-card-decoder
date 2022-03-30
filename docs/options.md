# Context.options

Some library functions require additonal options to complete an operation

```js
{
    // array of keys in JWK form for verifying signatures
    keys : JWK[],

    // a directory of issuer-keyset pairs for verifying signatures
    directory: { ... },

    // encoding related options
    encode : {

        // when encoding, this is required as part of the jwk.payload to set the public key url
        iss: string,

        // The fhirVersion string that goes into the jwk.payload - only set this if you don't want the default
        fhirVersion: string,

        // revocation identifier (optional) - only set if you require this property
        rid: string,

        // JWT nbf ("not before") - this is computed when encoding - only set if you want a specific value
        nbf: number,

        // The deflate level of the deflate library - the default is 6 - this is package dependant
        deflateLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
    },

    // default = true, if true artifacts decode recursivley. Set to false to only decode the specified artifact
    chain: boolean,

    // private key in JWK form used for signing the JWT
    privateKey: JWK

}
```

#  
[Readme](../README.md#smart-health-card-verifier-library) | [Context](./context.md#context-object)