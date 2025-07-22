import { celebrate, Joi, Segments } from "celebrate";

export const picked_item_by_sku = celebrate({
  [Segments.QUERY]: Joi.object({
    order_id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Invalid order_id. Must be a valid MongoDB ObjectId.",
        "any.required": "order_id is required.",
      }),
    sku: Joi.string().trim().required().messages({
      "any.required": "sku is required.",
    }),
  }),
});
