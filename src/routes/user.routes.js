import { Router } from "express";
import { verifyJWT } from "../middlewares/tokenVerification.js";
import {addPartnerRole} from "../controllers/user.controllers.js"

const router = Router();

// router.route('/register').post(registerUser);
// router.route('/login').post(loginUser);
// router.route('/send-otp').post(generateAndSendOTP);
// router.route('/verify-otp').post(verifyOTP);
router.use(verifyJWT);

router.route('/add-partner-role').post(addPartnerRole);


export default router;