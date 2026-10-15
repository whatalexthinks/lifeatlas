import { Router, type IRouter } from "express";
import accountRouter from "./account";
import healthRouter from "./health";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accountRouter);
router.use(storageRouter);

export default router;
