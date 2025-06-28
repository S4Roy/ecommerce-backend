import { Router } from "express";
import { wishListRouter } from "./wishlist.js";
import { cartRouter } from "./cart.js";
import { addressRouter } from "./address.js";

const v1UserRouter = Router();
// All routes go here

v1UserRouter.use("/wishlist", wishListRouter);
v1UserRouter.use("/cart", cartRouter);
v1UserRouter.use("/address", addressRouter);

export { v1UserRouter };
