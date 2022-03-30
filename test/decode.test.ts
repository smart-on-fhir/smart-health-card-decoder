// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import decode from '../src/decode.js';
import { checkErrors } from './utils.js';
import jws from '../src/jws.js'
import Context from '../src/context.js';
import { JWS } from '../src/types.js';
import {data} from './constants.js';


test('decode-compact-valid-shc', async () => {
    const result = await decode(data.compact);
    const context = new Context();
    context.jws = result.jws as JWS;
    jws.validate(context);
    checkErrors(context);
});
