# SMART Health Card Decoder

A library to decode & verify encoded __SMART Health Cards__ into a patient's COVID-19 immunization record.
<br><br>  

The most typical usage is to have an application scan a SMART QR-code with a scanner that decodes the QR-code into an 'shc' string and then pass this encoded 'shc' string to the `verify()` function along with a directory (list of supported issuers/keys).  
The 'shc' string will get decoded into an immunization 'card' and the signature will be verified using the supplied directory:  


```javascript
import {verify, directory} from 'smart-health-card-decoder'

// By default directory.download() will download a daily snapshot of the VCI directory
const vciDailySnapshot = await directory.download();

const encodedShc = 'shc:/56762909524 ... ';  // truncated

const result = await verify(encodedShc, {director: vciDailySnapshot});

console.log(JSON.stringify(result.card));

/* 
  {
    "verified": true,
    "immunizations": {
      "patient": {
        "name": "Anyperson, John B.",
        "dob": "1951-01-20T00:00:00.000Z"
      },
      "immunizations": [
        {
          "dose": 1,
          "date": "2021-01-01T00:00:00.000Z",
          "manufacturer": "Moderna US.",
          "performer": "ABC General Hospital"
        },
        {
          "dose": 2,
          "date": "2021-01-29T00:00:00.000Z",
          "manufacturer": "Moderna US.",
          "performer": "ABC General Hospital"
        }
      ]
    },
    "issuer": "smarthealth.cards"
  }
*/
```




<br><br>
#   
### Terms

__Decode__ : The process of converting the encoded form to a full data object. This library has `decode` functions that do the decoding tranformation with only the minimal amount of validation required to perform the encoding process. 

__Validate__: Scans a decoded object and does checks to verify a proper structure and returns a list of errors/warnings, if any.
 
__Verify__: Performs the `decode` step, then a `validate` step, and then verifies the issuer signature.



<br><br>
#   
### Install via GitHub

```bash
npm install github:smart-on-fhir/smart-health-card-decoder
```

```js
// then use as an npm package
import {verify} from 'smart-health-card-decoder'
```

<br><br>
#   
### Use in Browser

```html
<script src="C:\Repos\shc-decoder\umd\smart-health-card-decoder.umd.js"></script>
```



<br><br>  
#   
### Build from source

Alternatively, the package can be built from source following these steps.

1. Clone the source:

    ```bash
    git clone -b main https://github.com/smart-on-fhir/smart-health-card-decoder.git
    cd smart-health-card-decoder
    ```

1. Build the package:

    ```bash
    npm install
    npm run build
    ```

1. Optionally, run the tests:

    ```bash
    npm test
    ```


<br><br>
#
### Decoding  

A SMART Health Cards has several tiers of encoding:

- QR code image as a dataurl:  
```  
  'data:image/png;base64,iVBORw0KGg ... '  // truncated
```

- SHC string (resulting from decoding a SMART Health Card QR-image):
```
  'shc:/567629095243206034602924374 ... '  // truncated
```

- A compact JSON Web Signature (compact-JWS resulting from decoding an SHC string):
```
  'eyJ6aXAiOiJERUYiLCJhb... . iIsImtpZCI6IjNLZmRnLVh3UC... . 03Z1h5eXd0VWZVQUR3QnVE9Q...'  // truncated
```

- A flat JSON Web Signature (flat-JWS) object (an intermediate form of serialization before full JWS decoding):
```
  {
    header: 'eyJ6aXAiOiJERUYiLCJhb...' ,  // truncated
    payload: 'iIsImtpZCI6IjNLZmRnL...' ,
    signature: '03Z1h5eXd0VWZVQURa...' ,
  }
```

This library can decode each of these forms into it's underlying JWS/Fhir data.

The encodings are decoded and the signature is verified against an issuer with its public key. 



<br><br>  
#  
Using `verify()` with a keyset
<br>  

```javascript
import {verify} from 'smart-health-card-decoder'

// supply a list of valid public keys instead of a directory
const keys = [
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

// encoded SMART Health Card resulting from QR-code-scanner (truncated for brevity)
const encodedShc = 'shc:/56762909524 ... ';

const result = await verify(encodedShc, {keys});

console.log(JSON.stringify(result.record));

/* output
  {
    "verified": true,
    "immunizations": {
      "patient": {
        "name": "Anyperson, John B.",
        "dob": "1951-01-20T00:00:00.000Z"
      },
      "immunizations": [
        {
          "dose": 1,
          "date": "2021-01-01T00:00:00.000Z",
          "manufacturer": "Moderna US.",
          "performer": "ABC General Hospital"
        },
        {
          "dose": 2,
          "date": "2021-01-29T00:00:00.000Z",
          "manufacturer": "Moderna US.",
          "performer": "ABC General Hospital"
        }
      ]
    },
    "issuer": "unknown" 
  }
*/

```