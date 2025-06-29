import { Router } from "express";
import { inventoryController } from "../../../controllers/admin/index.js";
import { inventoryValidation } from "../../../validations/admin/index.js";

const orderRouter = Router();

orderRouter.get(
  "/list",
  inventoryValidation.productValidation.list,
  inventoryController.orderController.list
);

export { orderRouter };
