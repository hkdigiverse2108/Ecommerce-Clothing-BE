export const removeSensitiveData = (data: any, sensitiveFields: string[] = ['password', 'otp', 'pin', 'activeSession', '__v', 'isDeleted', 'socialId']) => {
    if (!data) return data;

    // Handle array case
    if (Array.isArray(data)) {
        return data.map(item => removeSensitiveData(item, sensitiveFields));
    }

    // Handle mongoose document (convert to plain object if needed)
    if (data.toObject && typeof data.toObject === 'function') {
        data = data.toObject();
    } else if (data._doc) { // Fallback for some mongoose versions/cases
        data = { ...data._doc };
    } else {
        // Deep clone to avoid mutating original object
        data = JSON.parse(JSON.stringify(data));
    }

    // Handle object case
    if (typeof data === 'object' && data !== null) {
        sensitiveFields.forEach(field => {
            delete data[field];
        });

        // Recursively clean fields that might contain objects (though for now just shallow clean + specific fields is mostly what's asked, 
        // but robust implementation usually cleans recursively. Given the user request "files like passwords", shallow top-level + recursive for nested objects is safer)

        Object.keys(data).forEach(key => {
            if (typeof data[key] === 'object' && data[key] !== null) {
                data[key] = removeSensitiveData(data[key], sensitiveFields);
            }
        });
    }

    return data;
}
