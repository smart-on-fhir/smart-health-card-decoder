// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Context from './context.js';
import download from './download.js';
import constants from './constants.js';
import { CvxCode } from './types.js';

const label = 'CTX';

async function downloadCovidCvxCodes(context: Context): Promise<{ [key: number]: CvxCode } | undefined> {

    const { log } = context;
    log.label = label;

    const url = constants.CVX_ALL_CODES_URL;

    const data = await download<string>(url).catch(err => {
        log.fatal(`Error downloading CVX codes ${err.toString()}.`);
        return;
    })

    if (!data || typeof data !== 'string') {
        log.fatal(`No CVX data downloaded.`);
        return;
    }

    const rows: string[] = data.trim().split(/\r?\n/);

    const allCvxCodes = rows
        .map(row => {
            const [name, description, cvx, manufacturer, mvx, mvxStatus, status, updated] = row.split('|');
            return {
                name,
                description,
                cvx: parseInt(cvx.trim()),
                manufacturer: manufacturer.trim().replace(', Inc', ''),
                mvx: mvx.trim(),
                mvxStatus,
                status,
                updated: new Date(updated)
            };
        });

    const covidCvxCodes = allCvxCodes.filter(entry => entry.description?.startsWith('COVID-19'));

    const indexCvxCodes: { [key: number]: CvxCode } = {};

    covidCvxCodes.forEach(code => {
        indexCvxCodes[code.cvx] = code;
    });

    return indexCvxCodes;
}

// default list for when we don't download the latest list
let cvxDefaultCodes: { [key: number]: CvxCode } = {
    207: {
        name: "Moderna COVID-19 Vaccine (non-US Spikevax)",
        description: "COVID-19, mRNA, LNP-S, PF, 100 mcg/0.5mL dose or 50 mcg/0.25mL dose",
        cvx: 207,
        manufacturer: "Moderna US.",
        mvx: "MOD",
        mvxStatus: "Active",
        status: "Active",
        updated: new Date("2021-07-13T07:00:00.000Z")
    },
    208: {
        name: "Pfizer-BioNTech COVID-19 Vaccine (EUA labeled)  COMIRNATY (BLA labeled)",
        description: "COVID-19, mRNA, LNP-S, PF, 30 mcg/0.3 mL dose",
        cvx: 208,
        manufacturer: "Pfizer",
        mvx: "PFR",
        mvxStatus: "Active",
        status: "Active",
        updated: new Date("2021-09-10T07:00:00.000Z")
    },
    210: {
        name: "AstraZeneca COVID-19 Vaccine (Non-US tradenames include VAXZEVRIA, COVISHIELD)",
        description: "COVID-19 vaccine, vector-nr, rS-ChAdOx1, PF, 0.5 mL ",
        cvx: 210,
        manufacturer: "AstraZeneca",
        mvx: "ASZ",
        mvxStatus: "Active",
        status: "Active",
        updated: new Date("2021-07-13T07:00:00.000Z")
    },
    211: {
        name: "Novavax COVID-19 Vaccine",
        description: "COVID-19, subunit, rS-nanoparticle+Matrix-M1 Adjuvant, PF, 0.5 mL",
        cvx: 211,
        manufacturer: "Novavax.",
        mvx: "NVX",
        mvxStatus: "Active",
        status: "Active",
        updated: new Date("2021-03-23T07:00:00.000Z")
    },
    212: {
        name: "Janssen (J&J) COVID-19 Vaccine",
        description: "COVID-19 vaccine, vector-nr, rS-Ad26, PF, 0.5 mL",
        cvx: 212,
        manufacturer: "Janssen",
        mvx: "JSN",
        mvxStatus: "Active",
        status: "Active",
        updated: new Date("2021-07-12T07:00:00.000Z")
    },
    217: {
        name: "Pfizer-BioNTech COVID-19 Vaccine (EUA labeled)  COMIRNATY (BLA labeled)",
        description: "COVID-19, mRNA, LNP-S, PF, 30 mcg/0.3 mL dose, tris-sucrose",
        cvx: 217,
        manufacturer: "Pfizer",
        mvx: "PFR",
        mvxStatus: "Active",
        status: "Active",
        updated: new Date("2021-09-10T07:00:00.000Z")
    },
    218: {
        name: "Pfizer-BioNTech COVID-19 Vaccine (EUA labeled)  COMIRNATY (BLA labeled)",
        description: "COVID-19, mRNA, LNP-S, PF, 10 mcg/0.2 mL dose, tris-sucrose",
        cvx: 218,
        manufacturer: "Pfizer",
        mvx: "PFR",
        mvxStatus: "Active",
        status: "Active",
        updated: new Date("2021-09-10T07:00:00.000Z")
    },
    219: {
        name: "Pfizer-BioNTech COVID-19 Vaccine (EUA labeled)  COMIRNATY (BLA labeled)",
        description: "COVID-19, mRNA, LNP-S, PF, 3 mcg/0.2 mL dose, tris-sucrose",
        cvx: 219,
        manufacturer: "Pfizer",
        mvx: "PFR",
        mvxStatus: "Active",
        status: "Active",
        updated: new Date("2021-09-10T07:00:00.000Z")
    },
    221: {
        name: "Moderna COVID-19 Vaccine (non-US Spikevax)",
        description: "COVID-19, mRNA, LNP-S, PF, 50 mcg/0.5 mL dose",
        cvx: 221,
        manufacturer: "Moderna US.",
        mvx: "MOD",
        mvxStatus: "Active",
        status: "Active",
        updated: new Date("2021-07-13T07:00:00.000Z")
    },
    225: {
        name: "Sanofi COVID-19 ",
        description: "COVID-19, D614, recomb, preS dTM, AS03 adjuvant add, PF, 5mcg/0.5mL",
        cvx: 225,
        manufacturer: "Sanofi Pasteur",
        mvx: "PMC",
        mvxStatus: "Active",
        status: "Active",
        updated: new Date("2022-03-10T08:00:00.000Z")
    },
    226: {
        name: "Sanofi COVID-19 ",
        description: "COVID-19, D614, recomb, preS dTM, AS03 adjuvant add, PF, 10mcg/0.5mL",
        cvx: 226,
        manufacturer: "Sanofi Pasteur",
        mvx: "PMC",
        mvxStatus: "Active",
        status: "Active",
        updated: new Date("2022-03-10T08:00:00.000Z")
    },
    502: {
        name: "COVAXIN (Bharat) COVID-19 Vaccine",
        description: "COVID-19 IV Non-US Vaccine (COVAXIN)",
        cvx: 502,
        manufacturer: "Bharat Biotech International Limited",
        mvx: "BBI",
        mvxStatus: "Active",
        status: "Active",
        updated: new Date("2021-11-09T08:00:00.000Z")
    },
    510: {
        name: "Sinopharm (BIBP) COVID-19 Vaccine",
        description: "COVID-19 IV Non-US Vaccine (BIBP, Sinopharm)",
        cvx: 510,
        manufacturer: "Sinopharm-Biotech",
        mvx: "SPH",
        mvxStatus: "Active",
        status: "Active",
        updated: new Date("2021-07-13T07:00:00.000Z")
    },
    511: {
        name: "Coronavac (Sinovac) COVID-19 Vaccine",
        description: "COVID-19 IV Non-US Vaccine (CoronaVac, Sinovac)",
        cvx: 511,
        manufacturer: "Sinovac",
        mvx: "SNV",
        mvxStatus: "Active",
        status: "Active",
        updated: new Date("2021-07-13T07:00:00.000Z")
    }
};

export { downloadCovidCvxCodes, cvxDefaultCodes };
