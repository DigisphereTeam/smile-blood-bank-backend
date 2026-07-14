import baseException from "./baseExceptions.js";

class UnprocessableEntityException extends baseException {

    constructor(message = "Unprocessable Entity", errors = null) {
        super(422, message);
        this.errors = errors;
    }

}

export default UnprocessableEntityException;