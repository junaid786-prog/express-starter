class APIResponse {
    constructor(success, statusCode, data, message = '') {
        this.success = success;
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
    }

    static success(data, message = '', statusCode = 200) {
        return new APIResponse(true, statusCode, data, message);
    }

    static error(message = 'Something went wrong', statusCode = 500) {
        return new APIResponse(false, statusCode, null, message);
    }
}

module.exports = APIResponse;