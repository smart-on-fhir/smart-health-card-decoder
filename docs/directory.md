# Directory

The Directory class acts as both an approved list of trusted issuers and a store of issuer keys/revocation lists.

A Smart Health Card (SHC) may be created and signed by any private key. To ensure that a SHC is verified against only trusted issuers, a Directory class is available.

Once a Directory is instantiated, it works as a cache of issuer keys and revocation data.

Creating a directory will download the directory and perform a validation on the directory data. If there are download or validation errors, it will be recorded in the `.errors` property of the resulting directory object.

<br>

## VCI Directory
The [vci](https://github.com/the-commons-project/vci-directory#vci-directory) directory is a repository that provides a public directory of institutions issuing SMART Health Cards for COVID-19 vaccination and laboratory diagnostic testing records. VCI provides a daily directory snapshot 
 

### Create a directory from a url

This will download the latest daily snapshot of the VCI directory and return a Directory instance that may be reused for multiple SHC verifications:
```js
import { verify, Directory } from 'smart-health-card-decoder';

const vciDirectoryUrl = 'https://raw.githubusercontent.com/the-commons-project/vci-directory/main/logs/vci_snapshot.json';

const myDirectory = Directory.create(vciDirectoryUrl);

if(myDirectory.errors) {
    // handle directory download or validation errors
}

const verificationResult = verify('shc:/0192938475...', myDirectory);

```
<br>


### Create a VCI directory  

This will download the latest daily snapshot of the VCI directory and return a Directory instance. You may use this instance repeatedly to validate multiple SHCs.
```js
import { verify, Directory } from 'smart-health-card-decoder';

const vciDirectory = Directory.create('vci');

const verificationResult = verify('shc:/0192938475...', vciDirectory);

```
<br>


### Create a directory from a list of issuer (iss) urls  
You may create a directory from a list of issuer iss urls. For each issuers, their keys and revocation data will be downloaded and cached in the Directory.
```js
import { verify, Directory } from 'smart-health-card-decoder';

const trustedIssuers = [
    "https://spec.smarthealth.cards/examples/issuer",
    "https://spec.smarthealth.cards/examples/issuer",
];

const myDirectory = Directory.create(trustedIssuers);

const verificationResult = verify('shc:/0192938475...', myDirectory);

```
<br>


### Create a directory from an object 
You may define a directory 
```js
import { verify, Directory } from 'smart-health-card-decoder';

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
                    y: "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8",
                    crlVersion: 2  // crlVersion is optional for revocation support
                }
            ],
            crls: [{ // crls is optional for revocation support
                kid: "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                method: "rid",
                ctr: 2,
                rids: [
                    "MKyCxh7p6uQ.1641358799",
                ]
            }],
            lastRetrieved: "2022-02-28T22:38:31Z",
        },
        {
            // additional issuers
        }
     ]
};

const myDirectory = Directory.create(directory);

const verificationResult = verify('shc:/0192938475...', myDirectory);

```
<br>

### Multiple Directories may be combined  
You may require directory data from more than one source. In this case, you can merge multiple directories into a single directory.
```js
const vciDirectory = Directory.create('vci');
const myDirectory = Directory.create(["https://spec.smarthealth.cards/examples/issuer"]);
const mergedDirectory = Directory.create([vciDirectory, myDirectory]);

```
<br>

>Note: The merging process will handle duplicate issuer data in the following ways:  
>- Identical _issuers_, _keys_, _crls_, and _rids_ will be combined into single instances.
>- When data differs, the lists will be combined.
>- When data versions can be determined (i.e. crlVersion, ctr, rid-timestamps), the older versions will be removed.

