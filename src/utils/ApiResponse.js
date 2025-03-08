class ApiResponse {
    constructor(statuscode, message = "Success", data = null) {
        this.statuscode = statuscode;  // ✅ Status code ko assign kiya
        this.message = message;
        this.data = data;
        this.success = statuscode < 400;
    }
}

export { ApiResponse };
