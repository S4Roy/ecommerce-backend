import { Router } from "express";
import { inventoryController } from "../../../controllers/webhook/index.js";
import { inventoryValidation } from "../../../validations/site/index.js";

const orderRouter = Router();

orderRouter.post("/update", inventoryController.orderController.update);
orderRouter.put("/update", inventoryController.orderController.update);
orderRouter.patch("/update", inventoryController.orderController.update);
orderRouter.get("/update", inventoryController.orderController.update);

export { orderRouter };
