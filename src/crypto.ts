// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

declare module "crypto" {
  namespace webcrypto {
    const subtle: SubtleCrypto;
  }
}

import nodeCrypto from 'crypto';
const subtle = nodeCrypto.webcrypto.subtle;

// @rollup/plugin-replace will replace the above with this to use the browser's webCrypto
// or a webCrypto polyfill
//
// import pollyFillCrypto from '../lib/msrCrypto.js';
// const subtle = typeof crypto === 'undefined' ? pollyFillCrypto : crypto;
//

export default subtle;
