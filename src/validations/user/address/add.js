import { celebrate, Joi } from "celebrate";

export const add = celebrate({
  body: Joi.object({
    full_name: Joi.string().min(2).max(100).required().messages({
      "string.base": "Full name must be a string",
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 2 characters",
      "string.max": "Full name cannot exceed 100 characters",
      "any.required": "Full name is required",
    }),

    phone: Joi.string()
      .pattern(/^[6-9]\d{9}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Phone number must be a valid 10-digit Indian mobile number",
        "string.empty": "Phone number is required",
        "any.required": "Phone number is required",
      }),

    email: Joi.string().email().optional().allow(null, "").messages({
      "string.email": "Email must be a valid email address",
    }),

    address_line1: Joi.string().min(5).max(200).required().messages({
      "string.base": "Address Line 1 must be a string",
      "string.empty": "Address Line 1 is required",
      "string.min": "Address Line 1 must be at least 5 characters",
      "string.max": "Address Line 1 cannot exceed 200 characters",
      "any.required": "Address Line 1 is required",
    }),

    address_line2: Joi.string().max(200).optional().allow(null, "").messages({
      "string.max": "Address Line 2 cannot exceed 200 characters",
    }),

    landmark: Joi.string().max(100).optional().allow(null, "").messages({
      "string.max": "Landmark cannot exceed 100 characters",
    }),

    city: Joi.string().min(2).max(100).required().messages({
      "string.empty": "City is required",
      "string.min": "City must be at least 2 characters",
      "string.max": "City cannot exceed 100 characters",
      "any.required": "City is required",
    }),

    state: Joi.string().min(2).max(100).required().messages({
      "string.empty": "State is required",
      "string.min": "State must be at least 2 characters",
      "string.max": "State cannot exceed 100 characters",
      "any.required": "State is required",
    }),

    country: Joi.string().default("India").messages({
      "string.base": "Country must be a string",
    }),

    pincode: Joi.string()
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        "string.pattern.base": "Pincode must be a valid 6-digit number",
        "any.required": "Pincode is required",
      }),

    address_type: Joi.string()
      .valid("home", "work", "other")
      .default("home")
      .messages({
        "any.only": "Address type must be 'home', 'work' or 'other'",
      }),

    purpose: Joi.string()
      .valid("shipping", "billing", "both")
      .default("shipping")
      .messages({
        "any.only": "Purpose must be 'shipping', 'billing' or 'both'",
      }),

    is_default: Joi.boolean().default(false).messages({
      "boolean.base": "is_default must be true or false",
    }),
  }),
});
