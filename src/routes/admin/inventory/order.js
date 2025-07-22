import { Router } from "express";
import { inventoryController } from "../../../controllers/admin/index.js";
import { inventoryValidation } from "../../../validations/admin/index.js";

const orderRouter = Router();

orderRouter.get(
  "/list",
  inventoryValidation.orderValidation.list,
  inventoryController.orderController.list
);
orderRouter.get(
  "/details",
  // inventoryValidation.orderValidation.list,
  inventoryController.orderController.order_details
);
orderRouter.get(
  "/stats",
  // inventoryValidation.orderValidation.list,
  inventoryController.orderController.stats
);
orderRouter.get(
  "/picked-item-by-sku",
  inventoryValidation.orderValidation.picked_item_by_sku,
  inventoryController.orderController.picked_item_by_sku
);
orderRouter.get(
  "/scan-and-pack-item",
  inventoryValidation.orderValidation.picked_item_by_sku,
  inventoryController.orderController.scan_and_pack_item
);

export { orderRouter };
