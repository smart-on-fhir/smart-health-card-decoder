import Context from '../src/context.js';
import jws from '../src/jws.js';
import { checkErrors } from "./utils.js";
import jws_compact from '../src/jws.compact.js';
import jws_flat from '../src/jws.flat.js';

// Add sample issuer to vci directory
const testDirectory = {
    "directory": "https://spec.smarthealth.cards/examples",
    "time": "2022-02-28T22:38:31Z",
    "issuerInfo": [
        {
            issuer: {
                iss: 'https://spec.smarthealth.cards/examples/issuer',
                name: 'smarthealth.cards'
            },
            keys: [
                {
                    "kty": "EC",
                    "kid": "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                    "use": "sig",
                    "alg": "ES256",
                    "crv": "P-256",
                    "x": "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw",
                    "y": "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8"
                }
            ]
        }]
};

const validCjws = 'eyJ6aXAiOiJERUYiLCJhbGciOiJFUzI1NiIsImtpZCI6IjNLZmRnLVh3UC03Z1h5eXd0VWZVQUR3QnVtRE9QS01ReC1pRUxMMTFXOXMifQ.3VLLbtswEPyVYHuV9XIcx7rVLtAXWrRo2kvgA02tLRYUKfAh2DX0791VHOSBJKecopOWnJ2dGe4RlPdQQRNC56ss8x3K1LfChQaFDk0qhat9hnvRdhp9RuiIDhIwmy1UxcX5dDGdzvNZejm7TKCXUB0hHDqE6vqO8zHdu5tiwgVRPY9TbRuN-ieCsuZFoLS9qosFrBOQDms0QQn9K27-ogwsadso9wedZ54KztM8LYiPT5fR1JrkHsGht9FJvBrlw-kiOdkBabUmthslNMAdyCMxR61_O02A2_4qJ8Bt8QTxD7JD_ZyhaDkoIhGt0sQH7w1hnB9n7FSPpPYavtiG62UK64EMbhSZ_yACcxWLWTHJi0mZwzAkT6phoy-o-fwwYh9EiLwQ0vKDB-QH6oWUyuDK1iODtLUyu1G4P_iA7Wl_6GUaPU-t22WcbOZVncl-TwTUwbPKfA7DekigO0UwytmiQ8Pa7idIICtldOMVm71SnBVRlKPhnG1RVFvrWtpH1iJksPR3hFr5TosxzuXq7CMadEKffbK-U0FoCopC1DZ8j-2GWyEfv-LZBMs3mWC5eO0ESRppo7lO1XT47ethtW_m3UX8SRf_AQ.XuJ0cGQ88PmT5drNtymbZiAA7VBQIKSG2jZbljdx8Gram3gNKXjy0jsADh8uDoPKdck90_EK9k6GKNLKmO8ygA';


/**
 * 
 * Validate
 * 
 */
 test('jws-encode', async () => {
    const context = new Context();
    context.compact = validCjws;
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
    context.compact = validCjws;
    jws_compact.decode(context);    // to context.flat -> context.jws
    jws.encode(context);            // context.jws -> context.flat
    jws_flat.validate(context);
    checkErrors(context);
});
