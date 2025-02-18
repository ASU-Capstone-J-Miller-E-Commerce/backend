export function makeResponse(status, data = false, logs = false, errors = false) {  //
    if (status !== "success" && status !== "expectedFailure") {
        throw new Error("Invalid status: must be string 'success' or 'expectedFailure'");
    }
    
    const response = { status };
    
    if (data !== false) {
        response.data = data;
    }
    
    if (logs !== false) {
        if (!Array.isArray(logs) || !logs.every(item => typeof item === "string")) {
            throw new Error("Invalid logs type: must be an array of strings");
        }
        response.logs = logs;
    }
    
    if (errors !== false) {
        if (!Array.isArray(errors) || !errors.every(item => typeof item === "string")) {
            throw new Error("Invalid errors type: must be an array of strings");
        }
        response.errors = errors;
    }
    
    return JSON.stringify(response);
}

export function makeData(data) {
    return makeResponse("success", data);
}

export function makeError(errors) {
    return makeResponse("expectedFailure", false, false, errors);
}