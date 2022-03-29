import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import cleanup from "rollup-plugin-cleanup";


const name = 'smart-health-card-decoder';
const extensions = ['.js', '.ts'];

export default [{
    input: './src/index.ts',

    external: [],

    plugins: [

        // Replaces NodeJs' webCrypto api with the built-in browser version - or a polyfill if not available
        replace({
            preventAssignment: false,  // required to replace assignment calls (e.g. foo = bar)
            delimiters: ['', ''],  // required to allow replacement of strings without default word boundries (\b)
            values: {
                "import nodeCrypto from 'crypto';": "import pollyFillCrypto from '../lib/msrCrypto.js';",
                "nodeCrypto.webcrypto": "((typeof crypto === 'undefined') ? pollyFillCrypto : crypto)"
            }
        }),

        // Allows node_modules resolution
        resolve({ extensions, browser: true, preferBuiltins: false }),

        // Allow bundling cjs modules. Rollup doesn't understand cjs
        commonjs(),

        cleanup({
            extensions: ['js'],
            comments: 'none'
        }),

        // Compile TypeScript/JavaScript files
        babel({

            // .ts extensions required for babel to process TypeScript files
            extensions,

            babelHelpers: 'bundled',

            // we need to transpile any dependencies that are not appropriate for the target            
            exclude: [

                // exclude fflate as it appears es5
                'node_modules\/(?!(fflate)\/).*',

                // we exclude core-js or we get a bunch of circular dependencies
                /\/core-js\//
            ]
        }),



    ],

    output: [
        {
            file: `./umd/${name.toLowerCase()}.umd.js`,
            format: 'umd',
            name,
            banner: '// Copyright (c) Microsoft Corporation.\n// Licensed under the MIT license.\n'
        }
    ]
}];
