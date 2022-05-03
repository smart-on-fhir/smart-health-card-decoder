export default {

    // This string is placed in jws.payload.vc.credentialSubject.fhirVersion if a value is not assigned through options.fhirVersion
    DEFAULT_FHIRVERSION: "4.0.1",

    // url to the daily vci directory snapshot
    VCI_DIRECTORY_DAILY_SNAPSHOT_URL: 'https://raw.githubusercontent.com/the-commons-project/vci-directory/main/logs/vci_snapshot.json',

    // default download timeout when downloading data (in milliseconds)
    DOWNLOAD_TIMEOUT: 10000,

    DOWNLOAD_INSTANCES: 8,

    SUBTLE_POLYFILL_PATH: '../lib/msrCrypto.cjs',

    // url to the cdc cvx definitions (w/ manufacturer) are located
    CVX_ALL_CODES_URL: 'https://www2a.cdc.gov/vaccines/iis/iisstandards/downloads/TRADENAME.txt',

    // the largest int of seconds that can be converted to milliseconds without overflow
    MAX_DATE_SECONDS: 8640000000000,
    

    URL_REGEX: /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/,

    CVX_DEFAULT_CODES: {
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
    }

}