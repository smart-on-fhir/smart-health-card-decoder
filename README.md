# SMART Health Card Decoder Library

A library to decode & verify encoded [__SMART Health Cards__](https://smarthealth.cards/en/) into a patient's FHIR data.
<br><br><br> 

Expected usage is to have an application scan a SMART Health Card QR-code with a QR-scanner. The QR code is decoded into an _shc_ string. This _shc_ string is then passed to the `verify()` function along with a directory (a list of application permitted issuers/keys).  
The _shc_ string will then be decoded into an immunization 'card' with the signature being verified using the supplied directory:  

<br><br> 
```javascript
// Basic usage

import {verify, Directory} from 'smart-health-card-decoder'

const resultFromQrScanner = 'shc:/56762909524 ... ';  // truncated

const vciDirectory = await Directory.create('vci'); // download daily VCI directory snapshot by default.

const result = await verify(resultFromQrScanner, vciDirectory);

if (result.verified === false) {
    const failureReason = result.reason;  // 'failed-validation' | 'bad-signature' | 'expired' | 'revoked'
    const failureErrors = result.data.errors;
    // handle errors
}

// success, do something with fhir data
const fhirBundle = result.data.fhirBundle;

```

The `result.data` object, returned above, is a _Context_ object.  See [Context object](./docs/context.md) for all the available data contained in this object. 

See [Directory](./docs/directory.md) for more information on the Directory class used above. 

See [VCI Directory](https://github.com/the-commons-project/vci-directory) for more information about the VCI Directory.

<br><br>
#   
### Install via GitHub

```bash
npm install github:smart-on-fhir/smart-health-card-decoder
```

```js
// import the package
import {verify} from 'smart-health-card-decoder'
```

<br><br>
#   
### Browser
The library build script generates a bundled script for browser use.  
Update the `babel.config.json` file to modify desired browser support.

```html
<script src="\umd\smart-health-card-decoder.umd.js"></script>

<script>

    var smart = window['smart-health-card-decoder'];

    var directory = await smart.Directory.create(["https://spec.smarthealth.cards/examples/issuer"]);

    // Decode & Verify the QR-data
    var result = await smart.verify(qrUrl, directory);

    if (result.verified === false) {
        const failureReason = result.reason;  // 'failed-validation' | 'bad-signature' | 'expired' | 'revoked'
        const failureErrors = result.data.errors;
        // handle errors
    }

    // success, do something with fhir data
    const fhirBundle = result.data.fhirBundle;


</script>
```



<br><br>  
#   
### Build from source

Alternatively, the package can be built from source following these steps.

1. Clone the source:

    ```bash
    git clone https://github.com/smart-on-fhir/smart-health-card-decoder.git
    cd smart-health-card-decoder
    ```

1. Build the package (install will trigger the _build_ script through the _prepare_ script):

    ```bash
    npm install
    ```

1. Optionally, run the tests:

    ```bash
    npm test
    ```




<br><br>  
#  
### Examples  

Using `verify()` with a constructed directory
```javascript
import {verify} from 'smart-health-card-decoder'

// supply a directory of issuer-keysets to verify against
// an issuer may possess several keys in .keys[]
const myDirectory = {
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
                    y: "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8"
                }
            ]
        }
    ]
};

const encodedShc = 'shc:/56762909524 ... ';

const directory = await smart.Directory.create(myDirectory);

const result = await verify(encodedShc, directory);

if (result.verified === false) {
    const failureReason = result.reason;  // 'failed-validation' | 'bad-signature' | 'expired' | 'revoked'
    const failureErrors = result.data.errors;
    // handle errors
}

// success, do something with fhir data
const fhirBundle = result.data.fhirBundle;

```

<br><br>
## Low Level API
See [Low Level API](./docs/api.md#low-level-api) for a list of more granular functions.
