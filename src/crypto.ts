import { webcrypto } from "crypto";

const subtle = (typeof crypto === 'undefined') ? (webcrypto as unknown as { subtle: SubtleCrypto }).subtle : crypto.subtle as SubtleCrypto;


export default subtle;
