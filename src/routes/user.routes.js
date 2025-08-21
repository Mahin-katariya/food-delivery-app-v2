import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
import { generateAndSendOTP, verifyOTP } from "../controllers/otp.controllers.js";

const router = Router();

router.route('/register').post(registerUser);
router.route('/send-otp').post(generateAndSendOTP);
router.route('/verify-otp').post(verifyOTP);

export default router;