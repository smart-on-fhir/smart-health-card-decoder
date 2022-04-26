/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    resolver: "jest-ts-webcompat-resolver",
    testTimeout: 15000,
    // resolver: we need this because nodejs & browser require that esm module imports have an extensions "import foo from './foo.js'"
    // TypeScript encourages you not to use an extension "import foo from './foo'"
    // If you don't supply an extension in your TS imports, your transpiled JavaScript will give you some form of 'module not found' error at runtime.
    // As a workaround, TypeScript allows you to use a JavaScript extension '.js' in your TypeScript imports and it works fine - so your
    // transpiled JavaScript will also have the extension as required by NodeJS and browser.
    // Unfortunately, ts-jest (& ts-node) will give you a 'module not found' error when you do include a JavaScript extension in your TS
    // files.  So, we use this custom resolver to help ts-jest resolve the imports correctly.
    // Apparently, this has been an issue with TS for some time. TS refuses to auto-add the .js extension to its transpiled code claiming that
    // it would be some sacred violation to modify your imports. So, they're perfectly content transpiling TS to non-working JS code.
};