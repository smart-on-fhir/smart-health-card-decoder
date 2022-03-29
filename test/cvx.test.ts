// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Context from '../src/context.js';
import { downloadCovidCvxCodes } from '../src/cvx.js';
import { checkErrors } from './utils.js';

test('directory-validate-valid', async () => {
    const context = new Context();
    const codes = await downloadCovidCvxCodes(context);
    checkErrors(context);
    expect(codes?.[208]).toMatchObject(cvx208);
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

