
// replaces commas with ampersands
const escapeCommas = function(str) {
    return (str.indexOf(',') >= 0) ? str.replace(/,/g, '&') : str;
};

// replaces double quotes, commas, and anything else
const escapeRaw = function(raw) {
    return escapeCommas(String(raw));
};

const escapeString = function(str) {
    return escapeCommas(str);
};

export default { escapeString, escapeRaw };
