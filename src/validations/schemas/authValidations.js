import Joi from "joi";

export const userLoginSchema = Joi.object({
    email: Joi.string()
        .trim()
        .email()
        .required()
        .messages({
            "any.required": "Email is required.",
            "string.base": "Invalid email address.",
            "string.empty": "Email is required.",
            "string.email": "Invalid email address."
        }),

    password: Joi.string()
        .trim()
        .required()
        .messages({
            "any.required": "Password is required.",
            "string.base": "Invalid password.",
            "string.empty": "Password is required."
        })
});


export const createUserSchema = Joi.object({
    first_name: Joi.string()
        .trim()
        .required()
        .messages({
            "any.required": "First name is required.",
            "string.base": "Invalid first name.",
            "string.empty": "First name is required."
        }),

    last_name: Joi.string()
        .trim()
        .allow("", null)
        .messages({
            "string.base": "Invalid last name."
        }),

    email: Joi.string()
        .trim()
        .email()
        .required()
        .messages({
            "any.required": "Email is required.",
            "string.base": "Invalid email address.",
            "string.empty": "Email is required.",
            "string.email": "Invalid email address."
        }),

    phone_number: Joi.string()
        .trim()
        .pattern(/^[0-9]{10}$/)
        .required()
        .messages({
            "any.required": "Phone number is required.",
            "string.base": "Invalid phone number.",
            "string.empty": "Phone number is required.",
            "string.pattern.base": "Phone number must contain exactly 10 digits."
        }),

    password: Joi.string()
        .trim()
        .min(8)
        .required()
        .messages({
            "any.required": "Password is required.",
            "string.base": "Invalid password.",
            "string.empty": "Password is required.",
            "string.min": "Password must be at least 8 characters."
        }),

    role: Joi.string()
        .trim()
        .valid("frontdesk", "technical")
        .default("frontdesk")
        .messages({
            "string.base": "Invalid role.",
            "any.only": "Invalid role."
        })
});