import Context from '../src/context.js';
import jws from '../src/jws.js';
import { checkErrors } from "./utils.js";
import jws_compact from '../src/jws.compact.js';
import jws_flat from '../src/jws.flat.js';
import {data} from './constants.js';


/**
 * 
 * Validate
 * 
 */
 test('jws-encode', async () => {
    const context = new Context();
    context.compact = data.compact;
    jws_compact.decode(context);  // to context.flat -> context.jws
    jws.validate(context);
    checkErrors(context);
});

/*
 * 
 * Encode
 * 
 */
 test('jws-encode', async () => {
    const context = new Context();
    context.compact = data.compact;
    jws_compact.decode(context);    // to context.flat -> context.jws
    jws.encode(context);            // context.jws -> context.flat
    jws_flat.validate(context);
    checkErrors(context);
});
