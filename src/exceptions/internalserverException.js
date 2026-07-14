import baseException from "./baseExceptions.js";

class InternalServerException extends baseException {

    constructor(message = "Internal Server Error") {
        super(500, message);
    }

}

export default InternalServerException;