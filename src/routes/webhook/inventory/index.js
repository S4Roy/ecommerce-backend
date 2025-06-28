import { Router } from "express";
import { categoryRouter } from "./category.js";
import { productRouter } from "./product.js";

const inventoryRouter = Router();
// All routes go here

inventoryRouter.use("/category", categoryRouter);
inventoryRouter.use("/product", productRouter);

export { inventoryRouter };
