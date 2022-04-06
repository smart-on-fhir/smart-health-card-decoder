// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// The Node types does not properly expose the webcrypto api, so we have to declare it ourselves to keep TS happy. 
declare module "crypto" {
  namespace webcrypto {
    const subtle: SubtleCrypto;
  }
}

// Uses browser web crypto api when available - defaults to a webcrypto polyfill when it's not
// Node15+ has a webcrypto api available. For Node14 and earlier, though, it does not
// So for now, we're just defaulting to the polyfill for all versions of Node.
// TODO: use Node crypto or webcrypto, when available.

const nodeCrypto = require('crypto');
const polyFillCrypto = require('../lib/msrCrypto.cjs');
const browserCrypto = typeof crypto === 'undefined' ? undefined : crypto;

let subtle = polyFillCrypto?.subtle;

// Node 15+
if( nodeCrypto?.webcrypto ) {
  subtle = nodeCrypto.webcrypto.subtle;
} 

// Node 14
else if ( nodeCrypto ) {
  // TODO: wrap node sign/verify
}

// Browser
else if ( browserCrypto ) {
  subtle = crypto.subtle;
}

export default subtle;
