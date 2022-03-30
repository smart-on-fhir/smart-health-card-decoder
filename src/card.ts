// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Context from "./context.js";
import fhir from "./fhir.js";
import { ImmunizationCard } from "./types.js";


function card(context: Context) : ImmunizationCard | undefined {

    const issuer = context.signature?.issuer?.name || context.signature?.issuer?.iss || '';
    const verified = !!context.signature?.verified;
    const immunizations = fhir.getImmunizationRecord(context);

    if(!immunizations) {
        return;
    }

    return {
        issuer,
        verified,
        patient: immunizations.patient,
        immunizations: immunizations.immunizations
    };

}

export default card;
