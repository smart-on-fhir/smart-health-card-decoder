import {Directory} from '../src/directory.js'
import Context from '../src/context.js';
import { ErrorCode } from '../src/log.js';
import { revoked } from "../src/revocation.js";
import shc from '../src/shc.js';
import { data } from './constants.js';


var vciDirectory: Directory;


beforeAll(async () => {
    vciDirectory = await Directory.create('vci');
});


const EC = ErrorCode;


test('revocation-validate', async () => {

    const dir = await Directory.create(data.directoryWithCrl);

    const context = new Context();
    context.shc = data.shc;
    context.directory = dir;
    await shc.decode(context);

    const results = await revoked(context);

}, 1000 * 60 * 5);
