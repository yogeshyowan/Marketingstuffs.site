import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import paymentRouter from "./payment";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(paymentRouter);
router.use(authRouter);

export default router;
