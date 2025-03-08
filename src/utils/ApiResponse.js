class ApiResponse extends Error {
    constructor(
        statuscode,
        message = "Success",
        data
    ) {
        super(message)
        this.data = data
        this.message = message
        this.success = statuscode < 400
    }
}

export { ApiResponse }