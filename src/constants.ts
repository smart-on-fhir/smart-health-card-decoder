// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export default {

    // This string is placed in jws.payload.vc.credentialSubject.fhirVersion if a value is not assigned through options.fhirVersion
    DEFAULT_FHIRVERSION : "4.0.1",

    // url to the cdc cvx definitions (w/ manufacturer) are located
    CVX_ALL_CODES_URL: 'https://www2a.cdc.gov/vaccines/iis/iisstandards/downloads/TRADENAME.txt',

    // url to the daily vci directory snapshot
    VCI_DIRECTORY_DAILY_SNAPSHOT_URL: 'https://raw.githubusercontent.com/the-commons-project/vci-directory/main/logs/vci_snapshot.json',

    // default download timeout when downloading data (in milliseconds)
    DOWNLOAD_TIMEOUT : 5000,

}