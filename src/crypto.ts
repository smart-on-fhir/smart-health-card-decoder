// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

declare module "crypto" {
    namespace webcrypto {
      const subtle: SubtleCrypto;
    }
  }

import nodeCrypto from 'crypto';
import pollyFillCrypto from '../lib/msrCrypto.js';

const subtle = (
    (typeof nodeCrypto !== 'undefined') ?
        nodeCrypto.webcrypto.subtle :
        (typeof crypto === 'undefined')
            ? pollyFillCrypto.subtle :
            crypto.subtle
) as SubtleCrypto;

export default subtle;
