import { Router } from "express";
import { inventoryRouter } from "./inventory/index.js";

const v1SiteRouter = Router();
// All routes go here

v1SiteRouter.use("/inventory", inventoryRouter);

export { v1SiteRouter };
