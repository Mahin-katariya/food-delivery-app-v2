import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user.controllers.js";
import { generateAndSendOTP, verifyOTP } from "../controllers/otp.controllers.js";

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/send-otp').post(generateAndSendOTP);
router.route('/verify-otp').post(verifyOTP);

export default router;