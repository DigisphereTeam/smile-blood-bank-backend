import Joi from "joi";

export const createBloodUnitSchema = Joi.object({
    donor_id: Joi.number()
        .integer()
        .required(),

    blood_group: Joi.string()
        .valid("A", "B", "AB", "O")
        .required(),

    rh_type: Joi.string()
        .valid("+", "-")
        .required(),

    collection_date: Joi.date()
        .required(),

    volume_ml: Joi.number()
        .min(1)
        .required(),

    remarks: Joi.string()
        .allow("", null)
});

export const createBloodUnitComponentsSchema = Joi.object({
    components: Joi.array()
        .min(1)
        .items(
            Joi.object({
                component_id: Joi.number().integer().required(),

                volume_ml: Joi.number()
                    .integer()
                    .min(1)
                    .required(),

                expiry_date: Joi.date().required()
            })
        )
        .required()
});


export const createDonorWithBloodUnitSchema = Joi.object({
    name: Joi.string()
        .trim()
        .required()
        .messages({
            "any.required": "Name is required.",
            "string.base": "Invalid name.",
            "string.empty": "Name is required."
        }),

    gender: Joi.string()
        .trim()
        .valid("Male", "Female", "Other")
        .required()
        .messages({
            "any.required": "Gender is required.",
            "string.base": "Invalid gender.",
            "string.empty": "Gender is required.",
            "any.only": "Invalid gender."
        }),

    age: Joi.number()
        .integer()
        .min(18)
        .max(65)
        .allow(null)
        .messages({
            "number.base": "Invalid age.",
            "number.integer": "Invalid age.",
            "number.min": "Age must be at least 18 years.",
            "number.max": "Age must not exceed 65 years."
        }),

    blood_group: Joi.string()
        .trim()
        .uppercase()
        .valid("A", "B", "AB", "O")
        .required()
        .messages({
            "any.required": "Blood group is required.",
            "string.base": "Invalid blood group.",
            "string.empty": "Blood group is required.",
            "any.only": "Invalid blood group."
        }),

    rh_type: Joi.string()
        .trim()
        .valid("+", "-")
        .required()
        .messages({
            "any.required": "Rh type is required.",
            "string.base": "Invalid rh type.",
            "string.empty": "Rh type is required.",
            "any.only": "Invalid rh type."
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

    email: Joi.string()
        .trim()
        .email()
        .allow("", null)
        .messages({
            "string.base": "Invalid email address.",
            "string.email": "Invalid email address."
        }),

    address: Joi.string()
        .trim()
        .allow("", null)
        .messages({
            "string.base": "Invalid address."
        }),

    weight: Joi.number()
        .positive()
        .allow(null)
        .messages({
            "number.base": "Invalid weight.",
            "number.positive": "Weight must be greater than 0."
        }),

    hemoglobin: Joi.number()
        .positive()
        .allow(null)
        .messages({
            "number.base": "Invalid hemoglobin.",
            "number.positive": "Hemoglobin must be greater than 0."
        }),

    last_donation_date: Joi.date()
        .allow(null)
        .messages({
            "date.base": "Invalid last donation date."
        }),

    collection_date: Joi.date()
        .required()
        .messages({
            "any.required": "Collection date is required.",
            "date.base": "Invalid collection date."
    }),

    volume_ml: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "any.required": "Volume is required.",
            "number.base": "Invalid volume.",
            "number.integer": "Invalid volume.",
            "number.positive": "Volume must be greater than 0."
        }),

    remarks: Joi.string()
        .trim()
        .allow("", null)
        .messages({
            "string.base": "Invalid remarks."
        })
});
