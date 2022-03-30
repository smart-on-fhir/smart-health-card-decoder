# SMART Health Card Verifier Library

A library to decode & verify encoded [__SMART Health Cards__](https://smarthealth.cards/en/) into a patient's COVID-19 immunization record.
<br><br><br> 

Expected usage is to have an application scan a SMART Health Card QR-code with a QR-scanner. The QR code is decoded into an _shc_ string. This _shc_ string is then passed to the `verify()` function along with a directory (a list of application permitted issuers/keys).  
The _shc_ string will then be decoded into an immunization 'card' with the signature being verified using the supplied directory:  

<br><br> 
```javascript
// Basic usage

import {verify, directory} from 'smart-health-card-decoder'

const resultFromQrScanner = 'shc:/56762909524 ... ';  // truncated

const vciDailySnapshot = await directory.download(); // download daily VCI directory snapshot by default.

const result = await verify(resultFromQrScanner, {director: vciDailySnapshot});

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

The `result` object, returned above, is a _Context_ object.  See [Context object](./docs/context.md) for all the available data contained in this object. 

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

  var qrImageDataUrl = 'data:image/png;base64,iVBORw0KGg ... '  // truncated';

  var approvedKeys = [
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

  // Decode & Verify the QR-data
  smart.verify( qrImageDataUrl, { keys: approvedKeys })
      .then(function (result) {
          var immunizationCard = result.card;
          // Do something with the results ...
      });

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

Using `verify()` with a keyset
<br>  

```javascript
import {verify} from 'smart-health-card-decoder'

// supply a list of valid public keys instead of a directory
// signature verification will only happen against keys in the array
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

// NOTE: verifying with keys only, will not match the issuer iss property


// encoded SMART Health Card resulting from QR-code-scanner (truncated)
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


Using verify() with a constructed directory
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

const result = await verify(encodedShc, {directory: myDirectory});

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

<br><br>
## Low Level API
See [Low Level API](./docs/api.md#low-level-api) for a list of more granular functions.



<br><br>
## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

<br><br>
## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft 
trademarks or logos is subject to and must follow 
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.