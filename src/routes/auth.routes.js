import { Router } from "express";

import {
    sendOtpController,
    loginWithOtpController,
    verifyRegistrationOtpController,
    registerUserController    
} from '../controllers/auth.controllers.js'

const router = Router();

// send otp for login or registeration.
router.route('/send-otp').post(sendOtpController);

// verify otp and then handle the login, also three different scenarios(for restaurant: existing mrchant who has completed his/her onboarding,existing user whose onboarding is incomplete,)
router.route('/login-with-otp').post(loginWithOtpController);

// intermediate step for create account
// it verifies the otp and routes the user intelligently based on their status
router.route('/verify-registration-otp').post(verifyRegistrationOtpController);

// takes user's detail and the temporary token to securely create an account.
router.route('/register').post(registerUserController);

export default router;