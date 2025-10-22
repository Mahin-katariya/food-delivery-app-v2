import { Router } from "express";
import { verifyJWT } from "../middlewares/tokenVerification.js";
import { isPartner,canAcessOnboardingSession } from "../middlewares/role.middlewares.js";
import { upload } from "../middlewares/multer.middleware.js";
import { startOnboardingSession, submitPhase1Data, submitPhase2Data, submitPhase3Data } from "../controllers/onboarding.controllers.js";

const router = Router();


router.use(verifyJWT,isPartner);


router.route('/start').post(startOnboardingSession);

router.route('/:sessionId/phase1').patch(canAcessOnboardingSession,submitPhase1Data);


router.route('/:sessionId/phase2').patch(
    canAcessOnboardingSession, //verify the user owns this session.
    // applying multer middleware to handle 'multipart form-data.
    // it will expect two files, one for menu and another for profile image of restaurant.
    // it saves them to a temporary local folder and makes them available to req.files.
    upload.fields([
        {name: 'menuImage', maxCount: 1},
        {name: 'restaurantProfileImage', maxCount: 1}
    ]),
    submitPhase2Data
)

router.route('/:sessionId/phase3').patch(canAcessOnboardingSession, submitPhase3Data)


export default router;