import Joi from "joi";

export const createPatientRequisitionSchema = Joi.object({
  patient_name: Joi.string().trim().required().messages({
    "any.required": "Patient name is required.",
    "string.base": "Invalid patient name.",
    "string.empty": "Patient name is required.",
  }),

  hospital_name: Joi.string().trim().required().messages({
    "any.required": "Hospital name is required.",
    "string.base": "Invalid hospital name.",
    "string.empty": "Hospital name is required.",
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
      "any.only": "Invalid blood group.",
    }),

  rh_type: Joi.string().trim().valid("+", "-").required().messages({
    "any.required": "Rh type is required.",
    "string.base": "Invalid rh type.",
    "string.empty": "Rh type is required.",
    "any.only": "Invalid rh type.",
  }),

  age: Joi.number().integer().positive().required().messages({
    "any.required": "Age is required.",
    "number.base": "Invalid age.",
    "number.integer": "Invalid age.",
    "number.positive": "Age must be greater than 0.",
  }),

  gender: Joi.string()
    .trim()
    .valid("Male", "Female", "Other")
    .required()
    .messages({
      "any.required": "Gender is required.",
      "string.base": "Invalid gender.",
      "string.empty": "Gender is required.",
      "any.only": "Invalid gender.",
    }),

  diagnosis: Joi.string().trim().required().messages({
    "any.required": "Diagnosis is required.",
    "string.base": "Invalid diagnosis.",
    "string.empty": "Diagnosis is required.",
  }),

  ip_number: Joi.string().trim().allow("", null).messages({
    "string.base": "Invalid IP number.",
  }),

  referred_by: Joi.string().trim().allow("", null).messages({
    "string.base": "Invalid referred by.",
  }),

  ward_no: Joi.string().trim().allow("", null).messages({
    "string.base": "Invalid ward number.",
  }),

  previous_transfusion: Joi.boolean().required().messages({
    "any.required": "Previous transfusion is required.",
    "boolean.base": "Invalid previous transfusion.",
  }),

  previous_transfusion_reaction: Joi.boolean().required().messages({
    "any.required": "Previous transfusion reaction is required.",
    "boolean.base": "Invalid previous transfusion reaction.",
  }),

  previous_transfusion_reaction_details: Joi.string()
    .trim()
    .allow("", null)
    .messages({
      "string.base": "Invalid previous transfusion reaction details.",
    }),

  is_emergency: Joi.boolean().required().messages({
    "any.required": "Emergency status is required.",
    "boolean.base": "Invalid emergency status.",
  }),

  compatibility_test_type: Joi.when("is_emergency", {
    is: true,
    then: Joi.string().trim().required().messages({
      "any.required": "Compatibility test type is required.",
      "string.base": "Invalid compatibility test type.",
      "string.empty": "Compatibility test type is required.",
    }),
    otherwise: Joi.string().trim().allow("", null),
  }),

  physician_name: Joi.when("is_emergency", {
    is: true,
    then: Joi.string().trim().required().messages({
      "any.required": "Physician_name is required.",
      "string.base": "Invalid physician_name.",
      "string.empty": "Physician_name is required.",
    }),
    otherwise: Joi.string().trim().allow("", null),
  }),

  emergency_details: Joi.string().trim().allow("", null).messages({
    "string.base": "Invalid emergency details.",
  }),

  transfusion_indications: Joi.array()
    .items(Joi.string().trim())
    .min(1)
    .required()
    .messages({
      "any.required": "At least one transfusion indication is required.",
      "array.base": "Invalid transfusion indications.",
      "array.min": "At least one transfusion indication is required.",
    }),

  components: Joi.array()
    .items(
      Joi.object({
        component_id: Joi.number().integer().positive().required().messages({
          "any.required": "Component ID is required.",
          "number.base": "Invalid component ID.",
          "number.integer": "Invalid component ID.",
          "number.positive": "Invalid component ID.",
        }),

        units_required: Joi.number().integer().positive().required().messages({
          "any.required": "Units required is required.",
          "number.base": "Invalid units required.",
          "number.integer": "Invalid units required.",
          "number.positive": "Units required must be greater than 0.",
        }),

        required_date_time: Joi.date().required().messages({
          "any.required": "Required date and time is required.",
          "date.base": "Invalid required date and time.",
        }),

        is_reserved: Joi.boolean().required().messages({
          "any.required": "Reservation status is required.",
          "boolean.base": "Reservation status must be either true or false.",
        })
      }),
    )
    .min(1)
    .required()
    .messages({
      "any.required": "At least one component is required.",
      "array.base": "Invalid components.",
      "array.min": "At least one component is required.",
    }),
});

export const updatePatientRequisitionSchema = Joi.object({
  patient_name: Joi.string().trim().messages({
    "string.base": "Invalid patient name.",
    "string.empty": "Patient name is required.",
  }),

  hospital_name: Joi.string().trim().messages({
    "string.base": "Invalid hospital name.",
    "string.empty": "Hospital name is required.",
  }),

  blood_group: Joi.string()
    .trim()
    .uppercase()
    .valid("A", "B", "AB", "O")
    .messages({
      "string.base": "Invalid blood group.",
      "string.empty": "Blood group is required.",
      "any.only": "Invalid blood group.",
    }),

  rh_type: Joi.string().trim().valid("+", "-").messages({
    "string.base": "Invalid rh type.",
    "string.empty": "Rh type is required.",
    "any.only": "Invalid rh type.",
  }),

  age: Joi.number().integer().positive().messages({
    "number.base": "Invalid age.",
    "number.integer": "Invalid age.",
    "number.positive": "Age must be greater than 0.",
  }),

  gender: Joi.string().trim().valid("Male", "Female", "Other").messages({
    "string.base": "Invalid gender.",
    "string.empty": "Gender is required.",
    "any.only": "Invalid gender.",
  }),

  diagnosis: Joi.string().trim().messages({
    "string.base": "Invalid diagnosis.",
    "string.empty": "Diagnosis is required.",
  }),

  ip_number: Joi.string().trim().allow("", null).messages({
    "string.base": "Invalid IP number.",
  }),

  referred_by: Joi.string().trim().allow("", null).messages({
    "string.base": "Invalid referred by.",
  }),

  ward_no: Joi.string().trim().allow("", null).messages({
    "string.base": "Invalid ward number.",
  }),

  previous_transfusion: Joi.boolean().messages({
    "boolean.base": "Invalid previous transfusion.",
  }),

  previous_transfusion_reaction: Joi.boolean().messages({
    "boolean.base": "Invalid previous transfusion reaction.",
  }),

  previous_transfusion_reaction_details: Joi.string()
    .trim()
    .allow("", null)
    .messages({
      "string.base": "Invalid previous transfusion reaction details.",
    }),

  is_emergency: Joi.boolean().messages({
    "boolean.base": "Invalid emergency status.",
  }),

  compatibility_test_type: Joi.when("is_emergency", {
    is: true,
    then: Joi.string().trim().required().messages({
      "any.required": "Compatibility test type is required.",
      "string.base": "Invalid compatibility test type.",
      "string.empty": "Compatibility test type is required.",
    }),
    otherwise: Joi.string().trim().allow("", null),
  }),

  physician_name: Joi.when("is_emergency", {
    is: true,
    then: Joi.string().trim().required().messages({
      "any.required": "Physician name is required.",
      "string.base": "Invalid physician name.",
      "string.empty": "Physician name is required.",
    }),
    otherwise: Joi.string().trim().allow("", null),
  }),

  emergency_details: Joi.string().trim().allow("", null).messages({
    "string.base": "Invalid emergency details.",
  }),

  transfusion_indications: Joi.array()
    .items(Joi.string().trim())
    .min(1)
    .messages({
      "array.base": "Invalid transfusion indications.",
      "array.min": "At least one transfusion indication is required.",
    }),

  components: Joi.array()
    .items(
      Joi.object({
        component_id: Joi.number().integer().positive().required().messages({
          "any.required": "Component ID is required.",
          "number.base": "Invalid component ID.",
          "number.integer": "Invalid component ID.",
          "number.positive": "Invalid component ID.",
        }),

        units_required: Joi.number().integer().positive().required().messages({
          "any.required": "Units required is required.",
          "number.base": "Invalid units required.",
          "number.integer": "Invalid units required.",
          "number.positive": "Units required must be greater than 0.",
        }),

        required_date_time: Joi.date().required().messages({
          "any.required": "Required date and time is required.",
          "date.base": "Invalid required date and time.",
        }),

        is_reserved: Joi.boolean().required().messages({
          "any.required": "Reservation status is required.",
          "boolean.base": "Reservation status must be either true or false.",
        }),
      }),
    )
    .min(1)
    .messages({
      "array.base": "Invalid components.",
      "array.min": "At least one component is required.",
    }),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required to update.",
  });

export const updateBloodGroupSchema = Joi.object({
  blood_group: Joi.string()
    .trim()
    .uppercase()
    .valid("A", "B", "AB", "O")
    .required()
    .messages({
      "any.required": "Blood group is required.",
      "string.base": "Invalid blood group.",
      "string.empty": "Blood group is required.",
      "any.only": "Invalid blood group.",
    }),

  rh_type: Joi.string().trim().valid("+", "-").required().messages({
    "any.required": "Rh type is required.",
    "string.base": "Invalid rh type.",
    "string.empty": "Rh type is required.",
    "any.only": "Invalid rh type.",
  }),
});
