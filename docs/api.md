
# Low Level API

It is expected that typical usage will involve passing qr-dataUrls or SMART Health Card (shc) strings to the main `verify` function and getting decoded and verified results.

The library also contains more granular functions for dealing with individual 'artifacts' - the intermediate strings and objects representing the various tiers of encoding.

<br>

This 'low-level' API has four classes of functions:

- `Decode`  
   Decodes artifacts to their decoded form.  `decode` does not perform any validation beyond what is required to decode the data. So don't assume decoded data is valid.  
   `decode` performs 'chaining' - meaning it recursively decodes resulting artifacts.

- `Encode`  
   Encodes artifacts to their encoded form. `encode` does perform validation of the artifacts as it encodes them. Unlike `decode`, `encode` does not perform 'chaining'.  Encoding an artifact only performs that single step.

- `Validate`  
   Performs validation on an artifact. `validate` does not perform any encoding or decoding. It only examines the specified artifact and logs errors/warning for invalid properties.

- `Signature`  
   Verifies the signature of the JSON Web Signature object. This requires the user to supply a directory or public key set.
   `signature` may also create a signature for a JSON Web Token (JWT). This requires the user to supply a private signing key.

<br>

These functions have a similar calling signature:
1. set the artifact on the Context object.
2. call the function passing the Context object.
3. examine the Context object for the results.

<br>

>Note: some of the low-level functions are asynchronous. This is denoted with the _await_ keyword in examples below.

<br>

#### Example : Low Level qr decode and verify  

This is essentially what the main `verify()` function does

```js
import { low, Context } from './src/index.js';

// create a new context
const context = new Context();

// set the qr property to a dataUrl representing the QR code image
context.qr = 'data:image/png;base64,iVBORw0KGgo ...'; // truncated

// decode the QR code to shc, compact-jws, flat-jws, jws, etc... (see Context)
await smart.low.decode.qr(context);

// check the context for decoding errors
if(context.errors) {
    // handle errors
}

// check the signature, we need a public keyset (or directory) 
context.options = {
    keys : [{ ... public JWK ...}];
}
await smart.low.signature.verify(context);

// check for signature errors
if(context.errors) {
    // handle errors
}

// validate the decoded jws object as 'decode' only performs minimal validation
smart.low.validate(context);

// check the context for validation errors
if(context.errors) {
    // handle errors
}

// collect the result ...
const fhir = context.fhirBundle;

```
>Note: see [Context object](../docs/context.md) for more information.

<br><br>

#### `low.decode`  

```js
context.qr = 'data:image/png;base64,iVBORw0KGgo ...';
await smart.low.decode.qr(context);
const result = context.shc;
```

```js
context.shc = 'shc:/1234556...';
await smart.low.decode.shc(context);
const result = context.compact;
```

```js
context.compact = 'eyJ6aXAiOiJERUYiLCJhbGciOiJFUzI1NiI ...';
smart.low.decode.jws.compact(context);
const result = context.flat;
```

```js
context.flat = { header: {...}, payload: {...}, signature: {...} };
smart.low.decode.jws.flat(context);
const result = context.jws;
```

```js
context.flat.header = 'eyJ6aXAiOiJERUYiLCJhbGciOiJFUzI1NiI ...';
smart.low.decode.jws.header(context);
const result = context.jws.header;
```

```js
context.flat.payload = '3ZLLbtswEEV_JZhuZb2c2LF2dQr0sSgKNO0 ...';
smart.low.decode.jws.payload(context);
const result = context.jws.payload;
```

```js
context.flat.signature = 'XuJ0cGQ88PmT5drNtymbZiAA7VB ...';
smart.low.decode.jws.signature(context);
const result = context.jws.signature;
```

<br>  


#### `low.validate`

```js
context.qr = 'data:image/png;base64,iVBORw0KGgo ...';
await smart.low.validate.qr(context);
const errors = context.errors;
```

```js
context.shc = 'shc:/1234556...';
smart.low.validate.shc(context);
const errors = context.errors;
```

```js
context.compact = 'eyJ6aXAiOiJERUYiLCJOiJFUzI1NiI ...';
smart.low.validate.jws.compact(context);
const errors = context.errors;
```

```js
context.flat = { header: '', payload: '', signature: '' };
smart.low.validate.jws.flat(context);
const errors = context.errors;
```

```js
context.flat.header = 'eyJ6aXAiOiJERUYiLCJhbGczI1NiI ...';
smart.low.validate.jws.header(context);
const errors = context.errors;
```

```js
context.flat.payload = '3ZLLbtswEEV_JZhuZb2c2LF2dQr0sSgKNO0 ...';
smart.low.validate.jws.payload(context);
const errors = context.errors;
```

```js
context.flat.signature = 'XuJ0cGQ88PmT5drNtymbZiAA7VB ...';
smart.low.validate.jws.signature(context);
const errors = context.errors;
```

```js
context.jws = { header: {...}, payload: {...}, signature: {...} };
smart.low.validate.jws(context);
const errors = context.errors;
```

```js
context.fhirBundle = {...};
smart.low.validate.fhir(context);
const errors = context.errors;
```


<br>

#### `low.encode`

```js
context.shc = 'shc:/1234556...';
await smart.low.encode.shc(context); 
const result = context.qr;
```

```js
context.compact = 'eyJ6aXAiOiJERUYiLCJhbGciOiJFUzI1NiI ...';
await smart.low.encode.jws.compact(context); 
const result = context.shc;
```

```js
context.flat = { header: '', payload: '', signature: '' };
smart.low.encode.jws.flat(context);  
const result = context.compact;
```

```js
context.jws.header = 'eyJ6aXAiOiJERUYiLCJhbGciOiJFUzI1NiI ...';
smart.low.encode.jws.header(context); 
const result = context.flat.header;
```

```js
context.jws.payload = '3ZLLbtswEEV_JZhuZb2c2LF2dQr0sSgKNO0 ...';
smart.low.encode.jws.payload(context); 
const result = context.flat.payload;
```

```js
context.jws.signature = 'XuJ0cGQ88PmT5drNtymbZiAA7VB ...';
smart.low.encode.jws.signature(context); 
const result = context.flat.signature;
```

```js
context.jws = { header: {...}, payload: {...}, signature: {...} };
smart.low.encode.jws(context); 
const result = context.flat; 
```

```js
context.fhirBundle = {...};
context.options = { iss: '<issuer public key url>' };
smart.low.encode.fhir(context); 
const result = context.jws.payload; 

```

<br>

#### `low.signature`

```js
// Signature Verification
const keys: [
    {
        kty: "EC",
        kid: "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
        use: "sig",
        alg: "ES256",
        crv: "P-256",
        x: "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw",
        y: "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8"
    }
];
const context = new Context({keys});
context.shc = 'shc:/1234556...';
await smart.low.decode.shc(context);
await smart.low.signature.verify(context);
```

```js
// Signature sign
const options = {
    privateKey: { ... private JWK ... },
    iss: '<issuer public key url>' 
};
const context = new Context(options);
context.fhir = { ... fhir data ...};
smart.low.encode.fhir(context);  // creates a new jws.payload
await smart.low.signature.sign(context);
const result = context.jwk; // new jwk with header, payload, and signature
```

#  
[Readme](../README.md#smart-health-card-verifier-library)