import { Router } from "express";
import { categoryRouter } from "./category.js";

const v1AdminRouter = Router();
// All routes go here

v1AdminRouter.use("/category", categoryRouter);

export { v1AdminRouter };
