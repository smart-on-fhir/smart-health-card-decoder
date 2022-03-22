const subtle:
    SubtleCrypto = typeof crypto === 'undefined' ?
        /* Node */ require('crypto').webcrypto.subtle :
        /* Browser */ crypto.subtle;


export default subtle;
