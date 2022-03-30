# Context object

The `Context` object is both the input and output of most of the library's functions.  
It is a collection of artifacts, logging, and state:

<br>

```js
Context : {

    // a dataUrl of the QR code image - this gets computed when you decode and shc string to give
    // you a pristine QR code for application display when the original scanned QR code may be less attractive.
    qr: 'data:image/png;base64,iVBORw0KGgoA ... ',  // truncated


    // an encoded SMART Health Card (shc) as a string
    shc: 'shc:/56762909524320603460292437404460312229595 ...',  // truncated


    // a JSON Web Signature in compact serialized form
    compact: 'shc:/56762909524320603460292437404460312229595 ...',  // truncated


    // a JSON Web Signature in the flat serialized form
    flat: {
        header: 'eyJ6aXAiOiJERUYiLCJhbGciOiJFUzI1NiIs ...',     // truncated
        payload: '3ZLLbtswEEV_JZhuZb2c2LF2dQr0sSgKNm8 ...',     // truncated
        signature: 'XuJ0cGQ88PmT5drNtymbZiAA7VBQIKSG2 ...'      // truncated
    },


    // the fully expanded JSON Web Signature object
    jws :{
        header: { ... header object ... },
        payload: { ... payload object ... },
        signature: Uint8Array
    },


    // a shortcut to the fhirBundle object within the jws.payload object
    fhirbundle: { ... fhir data ... },


    // signature verification results
    signature: {
        issuer: {
            iss: string, // JWT iss url to the issuer public key-set
            name: string // an issuer display name extracted from the matching directory entry
        },
        key: {  // the public key used to verify the signature
            ... JWK key data ...
        },
        verified: boolean // whether the signature was verified or not
    },


    // an immunization record constructed from issuer and fhir data 
    card: {
        issuer: string,  // issuer name or iss
        verified: boolean,  // the signature verification result
        patient: {
            name: string,
            dob: Date
        },
        immunizations :[
            {
                dose: number,
                date: string,
                manufacturer: string // manufacturer name extracted from a cdc cvx table
                performer: string // who did the immunization from the fhir data (if provided)
            },
            {
                ...
            }
        ]
    },


    // array of errors resulting from decode, encode, verification, etc...
    errors: undefined | LogEntry[], 


    // array of less-critical 'warnings' 
    warnings: undefined | LogEntry[],


    // the logging object that is passed around to the functions 
    // the 'errors' and 'warnings' properties above map into this
    log: Log, 


    // a collection of options provided by the user. some options are required for certain operations.
    options: { ... options ... } 

}
```

See  [Context.options](./options.md) for the list of available options.

#  
[Readme](../README.md#smart-health-card-verifier-library)