class ApiResponse {
    constructor(statusCode,data,message="success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400 //success will be set based on the status code as T/F
    }
}

export {ApiResponse}