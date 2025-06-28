import { celebrate, Joi } from "celebrate";

export const add = celebrate({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      "string.empty": "Category name is required",
      "string.min": "Category name must be at least 2 characters",
      "string.max": "Category name cannot exceed 100 characters",
    }),

    // slug: Joi.string()
    //   .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    //   .min(2)
    //   .max(100)
    //   .required()
    //   .messages({
    //     "string.empty": "Slug is required",
    //     "string.pattern.base":
    //       "Slug must contain only lowercase letters, numbers, and hyphens",
    //     "string.min": "Slug must be at least 2 characters",
    //     "string.max": "Slug cannot exceed 100 characters",
    //   }),

    description: Joi.string().max(50000).optional().allow("").messages({
      "string.max": "Description cannot exceed 50000 characters",
    }),

    brand: Joi.string().optional().allow(null, "").messages({
      "string.base": " brand must be a valid ID",
    }),
    category: Joi.string().optional().allow(null, "").messages({
      "string.base": " category must be a valid ID",
    }),

    images: Joi.array()
      .items(
        Joi.string().uri().messages({
          "string.uri": "Each image must be a valid URL",
        })
      )
      .optional()
      .messages({
        "array.base": "Images must be an array of valid URLs",
      }),

    status: Joi.string()
      .valid("active", "inactive")
      .default("active")
      .messages({
        "any.only": "Status must be either 'active' or 'inactive'",
      }),
    meta_title: Joi.string().max(255).optional().allow("", null).messages({
      "string.max": "Meta title cannot exceed 255 characters",
    }),

    meta_description: Joi.string()
      .max(1000)
      .optional()
      .allow("", null)
      .messages({
        "string.max": "Meta description cannot exceed 1000 characters",
      }),

    meta_keywords: Joi.string().optional().allow("", null).messages({
      "string.base": "Meta keywords must be a string",
    }),
  }),
});
