import { celebrate, Joi } from "celebrate";

export const list = celebrate({
  query: Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    _id: Joi.string().optional().allow("", null),
    search_key: Joi.string().optional().allow("", null),
    order_status: Joi.string().optional().allow("", null),
    sort_by: Joi.string()
      .optional()
      .allow("", null)
      .valid(
        "order_status",
        "grand_total",
        "created_at",
        "id",
        "user.name",
        "item_count",
        "items"
      ),
    sort_order: Joi.number().optional().allow(null).valid(-1, 1),
  }),
});
