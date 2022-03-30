// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Context from '../src/context.js';
import qr from '../src/qr.js';
import { checkErrors } from './utils.js';
import {data} from './constants.js';

// TODO: enable once we support qr dataUrl decoding on Node
test.skip('qr-decode-valid', async () => {
    const context = new Context();
    context.qr = data.qr;
    await qr.decode(context);
    checkErrors(context);
});

