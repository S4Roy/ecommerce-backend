import { Router } from "express";
import { inventoryRouter } from "./inventory/index.js";
import { customerRouter } from "./customer.js";

const v1AdminRouter = Router();
// All routes go here

v1AdminRouter.use("/inventory", inventoryRouter);
v1AdminRouter.use("/customer", customerRouter);

export { v1AdminRouter };
