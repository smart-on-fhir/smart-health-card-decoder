# Directory

The Directory class acts as both an approved list of trusted issuers and a store of issuer keys/revocation lists.

A Smart Health Card (SHC) may be created and signed by anybody's private key. To ensure that a SHC is verified against a set of trusted issuers, a Directory class is available.

Once a Directory is instaniated, it works as a cache of issuer keys and revocation data.

Creating a directory will download the directory and perform a validation on the directory data. If there are download or validation errors, it will be recorded in the `.errors` property of the resulting directory obejct.

<br>

## VCI Directory
The [vci](https://github.com/the-commons-project/vci-directory#vci-directory) directory
<br>


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

const myDirectory = Directory.create('vci');

const verificationResult = verify('shc:/0192938475...', myDirectory);

```
<br>


### Create a directory from a list of iss urls  
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
>- When data versions can be determend (i.e. crlVersion, ctr, rid-timestamps), the older versions will be removed.

