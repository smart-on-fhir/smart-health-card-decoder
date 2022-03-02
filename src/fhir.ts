import { Artifact } from "./log";
import { FhirBundle } from "./types";
import ValidationContext from "./context";


async function validate(fhir: FhirBundle, context: ValidationContext): Promise<ValidationContext> {

    const {log} = context;
    log.artifact = Artifact.FHIRBUNDLE;

    // TODO: fhir validation

    return context;
}


async function decode(context: ValidationContext): Promise<ValidationContext> {

    const {log} = context;
    log.artifact = Artifact.FHIRBUNDLE;

    context.fhirbundle = context.jws?.payload.vc.credentialSubject.fhirBundle;

    return context;
}


export default {decode, validate};