import Context from "./context.js";
import { Issuer } from "./types.js";
import { shcInfo } from "./utils.js";
import { parse } from "./rid.js";
import { Directory } from "./directory.js";


interface RevocationEntry {
    issuer: Issuer,
    crlVersion: number,
    crlCtr: number,
    kid: string,
    rid: {
        rid: string,
        seconds: number
    }
}


export async function revoked(context: Context): Promise<boolean> {

    const directory = context.directory;

    if (!directory) return false;

    // get required properties for verification from JWS
    const { kid, nbf, rid, iss } = shcInfo(context.jws);

    let revocationInfo = getRevocationInfo(directory, iss!, kid!, rid!);
    if (!revocationInfo) return false;

    // the revocation data may be outdated, attempt to download again
    // if (revocationInfo.crlVersion === 0 || revocationInfo.crlCtr !== revocationInfo.crlVersion) {
    //     // this will download the latest issuer keys and revocation material and directly update the directory
    //     await update(revocationInfo.issuer.iss, directory, context);
    //     revocationInfo = getRevocationInfo(directory, iss!, kid!, rid!);
    //     if (!revocationInfo) return false;
    // }

    return (revocationInfo.rid.seconds > nbf!);
}


export function getRevocationInfo(directory: Directory, shcIss: string, shcKid: string, shcRid: string): RevocationEntry | undefined {

    const issuerInfo = directory.issuerInfo.find(ii => ii.issuer.iss === shcIss);
    if (!issuerInfo) return undefined;

    const key = issuerInfo.keys.find(key => key.kid === shcKid);
    if (!key) return undefined;

    const crl = issuerInfo.crls?.find(crl => crl.kid === shcKid);
    if (!crl) return undefined;

    const rid = crl.rids.find(rid => parse(rid).rid === shcRid);
    if (!rid) return undefined;

    const parsedRid = parse(rid);

    return {
        kid: shcKid,
        crlCtr: crl.ctr,
        rid: parsedRid,
        issuer: issuerInfo.issuer,
        crlVersion: key.crlVersion ?? 0
    };

}
