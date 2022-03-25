import {verify} from '../src/index';


const validCjws = 'eyJ6aXAiOiJERUYiLCJhbGciOiJFUzI1NiIsImtpZCI6IjNLZmRnLVh3UC03Z1h5eXd0VWZVQUR3QnVtRE9QS01ReC1pRUxMMTFXOXMifQ.3ZJNj9MwEIb_ymq4pokTSktzo0XiSyAQy15QD64zbYz8EfkjalnlvzN2u2JBu3viRG6TmXn8vq99C9J7aKEPYfBtVfkBRek1d6FHrkJfCu46X-GR60Ghr2g6ooMCzG4Pbb2YL9jL56xhZT2vCxgFtLcQTgNC-_0382_cs3MxSwWhHp-TWkcjf_IgrXlyUNhRdvUKtgUIhx2aILn6Gnc_UIQkad9Ld4POJ04L85L0Ei_9XUfTKUwzDr2NTuB1lg-XRnGxA8IqRbSzEjrAncgjkaNS35yigbv9ltHAXfEA-DPZof2UIdd4hnAtFfHglaEZ5_MZBzmiSTm-t32q1yVsJzK4k2T-NQ-JVa9e1DNWzxoG01Q8qKZ-Ws27PyP2gYfos9104QHTBY1cCGlwY7tMELaT5pCF-5MPqC_vh26mV8vSukOVkq287CoxHgkg8iY0bAnTdipguESQ5ezRoUna7idIQ1aI6HIrmb2W-oxosmGWbFFUe-s0vcekhYtgXUJ20g-K5zjXm6s3aNBxdfXW-kEGrigoClHZ8CnqXVoFlr_60QSb_zLBZvWvE1ymBoUITnb08-OH0-bYL4dF_EKNXw.qIxp8j32EzRItn7hHrIfFKX163qlyYMMQ30fkYjOwl0Cgy5ssR9Oypas-KK-3AUFygu7mDrQmBGMiw44wgUqug';

const validShc = 'shc:/567629095243206034602924374044603122295953265460346029254077280433602870286471674522280928613331456437653141590640220306450459085643550341424541364037063665417137241236380304375622046737407532323925433443326057360106452933611232742428535076646807676662393862717766034360387620367604083623090777534477112457626152636563737733057205292172067360372609396443651173681212221229105230243544572171415762213756620455092527696229572272070943002637090326596905580966663222772607355353054431126131080975594539057322755825713154363958332200500306110550547006327538744259276700394262546157502858694363764033593755734030715840285975055228316509266554504028366252551231550735342903073111083103246050124340573930407477236905333972210463580043376526752011286837533877246169206554586162523338060876605853731263712720435724200023354566570540285555075965207125572758635224450850324521776460383964007106056804764170297730076205390033360029415212560423334277756626030436116830450042700510357635055844576670120403073627392144045422266374441071322431523908672225000832356822507359050964411173387262344162680511102266752758625811604403532065395560675872243836085677376640655210605528360452280927286964530542006675667064264253252540560070037354566259447158434029050358003008776143640970065233217555574342006224266960586622632745112265684341662563695009033638535077312145734273240476642166402839655303110034270300534431075525502430334374016828756711610605247737287165105927692857253043040906686376443232360603576244613474630322587608707037123476675270003030000620402576587210642369366421263260740707745840687258';



const testDirectory = {
    directory: "https://spec.smarthealth.cards/examples",
    time: "2022-02-28T22:38:31Z",
    issuerInfo: [
        {
            issuer: {
                iss: 'https://spec.smarthealth.cards/examples/issuer',
                name: 'smarthealth.cards'
            },
            keys: [
                {
                    kty: "EC",
                    kid: "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                    use: "sig",
                    alg: "ES256",
                    crv: "P-256",
                    x: "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw",
                    y: "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8"
                }
            ]
        }]
};


/**
 * 
 * Decode
 * 
 */
test('verify-decode-jws-compact-0', async () => {
    const verificationRecord = await verify(validCjws, { directory: testDirectory });
    expect(verificationRecord).toMatchObject(testVerificationRecord);
});

test('verify-decode-shc', async () => {
    const verificationRecord = await verify(validShc, { directory: testDirectory });
    expect(verificationRecord).toMatchObject(testVerificationRecord);
});

test('verify-decode-jws-compact-altered-signature', async () => {
    const badSignature = validCjws.replace('.qI', '.qJ');
    const verificationRecord = await verify(badSignature, { directory: testDirectory });
    expect(verificationRecord).toMatchObject({ ...testVerificationRecord, verified: false });
});


const testVerificationRecord = {
    verified: true,
    immunizations: {
        patient: {
            name: "Anyperson, John B.",
            dob: new Date("1951-01-20T00:00:00.000Z")
        },
        immunizations: [
            {
                date: new Date("2021-01-01T00:00:00.000Z"),
                code: "207",
                system: "http://hl7.org/fhir/sid/cvx",
                performer: "ABC General Hospital"
            },
            {
                date: new Date("2021-01-29T00:00:00.000Z"),
                code: "207",
                system: "http://hl7.org/fhir/sid/cvx",
                performer: "ABC General Hospital"
            }
        ]
    },
    issuer: "smarthealth.cards"
}
