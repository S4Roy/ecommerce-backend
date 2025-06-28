import { Router } from "express";
import { inventoryController } from "../../../controllers/admin/index.js";
import { inventoryValidation } from "../../../validations/admin/index.js";

const productRouter = Router();

productRouter.get(
  "/list",
  inventoryValidation.productValidation.list,
  inventoryController.productController.list
);

productRouter.get(
  "/details/:slug",
  inventoryValidation.productValidation.details,
  inventoryController.productController.list
);

productRouter.post(
  "/add",
  inventoryValidation.productValidation.add,
  inventoryController.productController.add
);

productRouter.put(
  "/edit",
  inventoryValidation.productValidation.edit,
  inventoryController.productController.edit
);

productRouter.delete(
  "/delete",
  inventoryValidation.productValidation.remove,
  inventoryController.productController.remove
);

export { productRouter };
