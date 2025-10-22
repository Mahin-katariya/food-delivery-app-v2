class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack=""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null //this is written for Api response consistency on client-side(front-end) suppose api responds succesfully the data will be like data = {"name":"Mahin","age":19} but suppose while access res.data api failed so the frontend will face undefined which will cause problems but if we by default assign it as null such errors wont be faced.
        this.message = message
        this.success = false
        this.errors = errors

        //helps for tracing all the functions that are executing and the one where the error occurs is traced to the top of the stack and by going down we can get to know the flow of how the functions are getting executed or being called.
        if(stack) {
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
    toJSON() {
        return {
            statusCode: this.statusCode,
            success: this.success,
            message: this.message,
            errors: this.errors,
            data: this.data
        };
    }
}

export {ApiError}