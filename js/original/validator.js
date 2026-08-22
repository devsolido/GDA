function sanitizeHTML(input) {
    if (typeof input !== 'string') return input;
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
    return input.replace(/[&<>"'/`=]/g, function(s) {
        return map[s];
    });
}
function sanitizeSQL(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/'/g, "''").replace(/;/g, '');
}
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}
function validateNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}
function sanitizeObject(obj) {
    if (typeof obj === 'string') return sanitizeHTML(obj);
    if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));
    if (obj && typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[sanitizeHTML(key)] = sanitizeObject(obj[key]);
            }
        }
        return result;
    }
    return obj;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeHTML,
        sanitizeSQL,
        validateEmail,
        validateNumber,
        sanitizeObject
    };
}
