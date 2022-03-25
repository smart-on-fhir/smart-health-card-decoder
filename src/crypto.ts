const cryptoObj = (typeof crypto !== 'undefined') ? crypto : require('crypto').webcrypto;

const subtle = cryptoObj.subtle;

export default subtle;
