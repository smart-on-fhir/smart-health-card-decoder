// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import c from 'crypto';

const subtle = (typeof c?.webcrypto !== 'undefined') ? (c.webcrypto as unknown as {subtle: SubtleCrypto}).subtle : crypto.subtle;

export default subtle;