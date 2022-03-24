# SMART Health Card Decoder

An API to decode encoded __SMART Health Cards__ to health records (FHIR Bundle)

<br><br>  

---  
## Install

<br><br>  

---  
## Build

<br><br>  

---  
## Examples: 
Basic decoding of encoded SMART Health Card.  
<br>  

```javascript
import smart from 'smart-health-card-decoder'

// Directory containing an issuer and public key to verify the signature against
const directory = {
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
        }]
    };

// encoded SMART Health Card resulting from QR-code-scanner
const encodedShc = 'shc:/56762909524 ... 320603460292437404';

const immunizationRecords = await smart.verify(encodedShc, {directory});

console.log(JSON.stringify(immunizationRecords));

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
            "date": "2021-01-01T00:00:00.000Z",     
            "code": "207",
            "system": "http://hl7.org/fhir/sid/cvx",
            "performer": "ABC General Hospital"     
          },
          {
            "date": "2021-01-29T00:00:00.000Z",     
            "code": "207",
            "system": "http://hl7.org/fhir/sid/cvx",
            "performer": "ABC General Hospital"     
          }
        ]
      },
      "issuer": "smarthealth.cards"
    }
*/

```