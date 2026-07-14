import UnprocessableEntityException from "../exceptions/unprocessableEntityException.js";

const validateRequest = (schema, req) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        const errors = {};

        error.details.forEach((err) => {
            const key = err.path.length ? err.path.join(".") : "general";
            errors[key] = err.message.replace(/"/g, "");
        });

        throw new UnprocessableEntityException(
            "Validation failed.",
            errors
        );
    }

    return value;
};

export default validateRequest;