// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Context from '../src/context.js';
import { download as downloadCovidCvxCodes } from '../src/cvx.js';
import { checkErrors } from './utils.js';

test('cvx-download', async () => {
    const context = new Context();
    const codes = await downloadCovidCvxCodes(context);
    checkErrors(context);
    // updated will have different values on different systems
    expect(codes?.[208]).toMatchObject({...cvx208, updated: codes?.[208].updated});
});


const cvx208 = {
    name: "Pfizer-BioNTech COVID-19 Vaccine (EUA labeled)  COMIRNATY (BLA labeled)",
    description: "COVID-19, mRNA, LNP-S, PF, 30 mcg/0.3 mL dose",
    cvx: 208,
    manufacturer: "Pfizer",
    mvx: "PFR",
    mvxStatus: "Active",
    status: "Active",
    updated: new Date("2021-09-10T07:00:00.000Z")
};

