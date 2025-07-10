import { celebrate, Joi } from "celebrate";

export const picked_item_by_sku = celebrate({
  query: Joi.object({
    order_id: Joi.string().required(),
    sku: Joi.string().required(),
  }),
});
