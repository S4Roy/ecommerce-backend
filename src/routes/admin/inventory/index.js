import { Router } from "express";
import { categoryRouter } from "./category.js";
import { brandRouter } from "./brand.js";
import { productRouter } from "./product.js";
import { stockRouter } from "./stock.js";
import { orderRouter } from "./order.js";

const inventoryRouter = Router();
// All routes go here

inventoryRouter.use("/category", categoryRouter);
inventoryRouter.use("/brand", brandRouter);
inventoryRouter.use("/product", productRouter);
inventoryRouter.use("/stock", stockRouter);
inventoryRouter.use("/order", orderRouter);

export { inventoryRouter };
