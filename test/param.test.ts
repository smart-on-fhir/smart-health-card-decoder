import { param } from '../src/param.js';



test('string', () => {

    const s = 'abcoddalsdasiudfoi';

    if (param<string>(s, 's').required().props(['length']).string().length(4, 20).pattern(/\w+/).failed) {


    }

})