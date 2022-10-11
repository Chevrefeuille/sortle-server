import { checkDuplicateUsernameOrEmail } from "../middlewares";
import { controller } from "../controllers/auth.controller";
import express, { Router, Request, Response } from "express";

const router: Router = express.Router();

router.use(function (req: any, res: any, next: any) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

router.post("/signup", [checkDuplicateUsernameOrEmail], controller.signup);
router.post("/signin", controller.signin);
router.post("/refreshtoken", controller.refreshToken);

export default router;
