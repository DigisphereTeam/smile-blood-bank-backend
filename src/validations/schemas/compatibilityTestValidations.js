import Joi from "joi";

export const createCompatibilityTestSchema = Joi.object({
    
    blood_unit_component_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "any.required": "Blood unit component ID is required.",
            "number.base": "Blood unit component ID must be a number.",
            "number.integer": "Blood unit component ID must be an integer.",
            "number.positive": "Blood unit component ID must be a positive number."
        }),

    compatibility_test_type: Joi.string()
        .trim()
        .valid(
            "Immediate Spin Crossmatch",
            "AHG Crossmatch",
            "Electronic Crossmatch"
        )
        .required()
        .messages({
            "any.required": "Compatibility test type is required.",
            "string.empty": "Compatibility test type is required.",
            "any.only": "Invalid compatibility test type."
        }),

    abo_rh_result: Joi.string()
        .trim()
        .valid("Compatible", "Incompatible")
        .required()
        .messages({
            "any.required": "ABO & Rh result is required.",
            "string.empty": "ABO & Rh result is required.",
            "any.only": "Invalid ABO & Rh result."
        }),

    hiv_1_2_result: Joi.string()
        .trim()
        .valid("Negative", "Positive")
        .required()
        .messages({
            "any.required": "HIV 1 & 2 result is required.",
            "string.empty": "HIV 1 & 2 result is required.",
            "any.only": "Invalid HIV 1 & 2 result."
        }),

    hbsag_result: Joi.string()
        .trim()
        .valid("Negative", "Positive")
        .required()
        .messages({
            "any.required": "HBsAg result is required.",
            "string.empty": "HBsAg result is required.",
            "any.only": "Invalid HBsAg result."
        }),

    hcv_result: Joi.string()
        .trim()
        .valid("Negative", "Positive")
        .required()
        .messages({
            "any.required": "HCV result is required.",
            "string.empty": "HCV result is required.",
            "any.only": "Invalid HCV result."
        }),

    vdrl_result: Joi.string()
        .trim()
        .valid("Negative", "Positive")
        .required()
        .messages({
            "any.required": "VDRL result is required.",
            "string.empty": "VDRL result is required.",
            "any.only": "Invalid VDRL result."
        }),

    malaria_result: Joi.string()
        .trim()
        .valid("Negative", "Positive")
        .required()
        .messages({
            "any.required": "Malaria result is required.",
            "string.empty": "Malaria result is required.",
            "any.only": "Invalid Malaria result."
        }),

    crossmatch_result: Joi.string()
        .trim()
        .valid("Compatible", "Incompatible")
        .required()
        .messages({
            "any.required": "Crossmatch result is required.",
            "string.empty": "Crossmatch result is required.",
            "any.only": "Invalid crossmatch result."
        }),

    remarks: Joi.string()
        .trim()
        .allow("", null)
        .messages({
            "string.base": "Remarks must be a string."
        }),

    status: Joi.string()
        .trim()
        .valid("Pending", "Completed")
        .default("Completed")
        .messages({
            "any.only": "Invalid status."
        })
});