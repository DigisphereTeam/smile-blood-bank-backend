import Joi from "joi";

export const createBloodComponentSchema = Joi.object({
    component_name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            "string.base": "Component name must be a string.",
            "string.empty": "Component name is required.",
            "string.min": "Component name must be at least 2 characters.",
            "string.max": "Component name cannot exceed 100 characters.",
            "any.required": "Component name is required."
        })
});