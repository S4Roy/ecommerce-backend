import { Router } from "express";
import { inventoryRouter } from "./inventory/index.js";

const v1AdminRouter = Router();
// All routes go here

v1AdminRouter.use("/inventory", inventoryRouter);

export { v1AdminRouter };
