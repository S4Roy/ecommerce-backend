import { celebrate, Joi } from "celebrate";

export const edit = celebrate({
  body: Joi.object({
    _id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Address ID is required",
        "string.pattern.base": "Invalid Address ID format",
      }),

    full_name: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .allow(null, "")
      .messages({
        "string.base": "Full name must be a string",
        "string.min": "Full name must be at least 2 characters",
        "string.max": "Full name cannot exceed 100 characters",
      }),

    phone: Joi.string()
      .pattern(/^[6-9]\d{9}$/)
      .optional()
      .allow(null, "")
      .messages({
        "string.pattern.base":
          "Phone number must be a valid 10-digit Indian mobile number",
      }),

    email: Joi.string().email().optional().allow(null, "").messages({
      "string.email": "Email must be a valid email address",
    }),

    address_line1: Joi.string()
      .min(5)
      .max(200)
      .optional()
      .allow(null, "")
      .messages({
        "string.base": "Address Line 1 must be a string",
        "string.min": "Address Line 1 must be at least 5 characters",
        "string.max": "Address Line 1 cannot exceed 200 characters",
      }),

    address_line2: Joi.string().max(200).optional().allow(null, "").messages({
      "string.max": "Address Line 2 cannot exceed 200 characters",
    }),

    landmark: Joi.string().max(100).optional().allow(null, "").messages({
      "string.max": "Landmark cannot exceed 100 characters",
    }),

    city: Joi.string().min(2).max(100).optional().allow(null, "").messages({
      "string.min": "City must be at least 2 characters",
      "string.max": "City cannot exceed 100 characters",
    }),

    state: Joi.string().min(2).max(100).optional().allow(null, "").messages({
      "string.min": "State must be at least 2 characters",
      "string.max": "State cannot exceed 100 characters",
    }),

    country: Joi.string().optional().allow(null, "").messages({
      "string.base": "Country must be a string",
    }),

    pincode: Joi.string()
      .pattern(/^\d{6}$/)
      .optional()
      .allow(null, "")
      .messages({
        "string.pattern.base": "Pincode must be a valid 6-digit number",
      }),

    address_type: Joi.string()
      .valid("home", "work", "other")
      .optional()
      .messages({
        "any.only": "Address type must be 'home', 'work' or 'other'",
      }),

    purpose: Joi.string()
      .valid("shipping", "billing", "both")
      .optional()
      .messages({
        "any.only": "Purpose must be 'shipping', 'billing' or 'both'",
      }),

    is_default: Joi.boolean().optional().messages({
      "boolean.base": "is_default must be true or false",
    }),
  }),
});
