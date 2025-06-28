import { Router } from "express";
import { inventoryController } from "../../../controllers/site/index.js";
import { inventoryValidation } from "../../../validations/site/index.js";

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
productRouter.get(
  "/wishlist",
  inventoryValidation.productValidation.wishlist,
  inventoryController.productController.wishlist
);
productRouter.put(
  "/wishlist/toggle",
  inventoryValidation.productValidation.toggleWishList,
  inventoryController.productController.toggleWishList
);
productRouter.get(
  "/carts",
  inventoryValidation.productValidation.carts,
  inventoryController.productController.carts
);
productRouter.put(
  "/cart/manage",
  inventoryValidation.productValidation.cartManage,
  inventoryController.productController.cartManage
);
productRouter.get(
  "/common/counts",
  inventoryController.productController.counts
);

export { productRouter };
