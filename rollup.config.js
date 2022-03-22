import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';

const name = 'VerifySmartHealthcard';
const extensions = ['.js', '.ts'];

export default [{
    input: './src/index.ts',

    // Specify here external modules which you don't want to include in your bundle (for instance: 'lodash', 'moment' etc.)
    // https://rollupjs.org/guide/en#external-e-external
    external: [],


    plugins: [
        // Allows node_modules resolution
        resolve({ extensions, browser: true, preferBuiltins: false }),

        // Allow bundling cjs modules. Rollup doesn't understand cjs
        commonjs(),

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
        })
    ],

    output: [
        {
            file: `./dist/${name.toLowerCase()}.browser.js`,
            format: 'umd',
            name
        },
        {
            file: `./dist/${name.toLowerCase()}.node.js`,
            format: 'esm',
            name
        }
    ]
}];
