import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

import { createSession,savePhase1Data,savePhase2Data,savePhase3Data } from "../services/onboarding.service.js";


// starting a new onboarding session.

// job: get the user loggged in and tell ther service to create a sesison

export const startOnboardingSession = asyncHandler(async (req,res) => {
    console.log("-- 1. reached onboarding controller method");
    
    const managerId = req.user.id;
    if(!managerId) throw new ApiError(400,"manager id not found!");
    console.log("managerId found");
    
    console.log("--- 3. Calling 'createSession' service ---");
    const session = await createSession(managerId);
    if(!session) throw new ApiError(400,"Session failed to be created");
    console.log("--- 4. 'createSession' service finished successfully ---");
    return res.status(200).json(new ApiResponse(200,session,"Onboarding session started successfully"))
})


// submitting restaurant information
// job: gather all the information and delegates the saving logic to the service

export const submitPhase1Data = asyncHandler(async (req,res) => {
    console.log("---1.entered the submitPhase1Data controller---");
    
    const {sessionId} = req.params;
    console.log(`---2.sessionId is : ${sessionId}---`);
    
    // get all the data
    const {
        brandName,
        brandDescription,
        branchName,
        street_address,
        pincode,
        city_id,
        latitude,
        longitude
    } = req.body;

    if(!brandName || !branchName || !street_address || !pincode || !city_id){
        throw new ApiError(400,"Brand name, branch name, and complete address is required");
    };
    console.log(`---3.recieved all the fields---`);
    
    // Delegate the complex database operations to the service layer.
    const updatedSession = await savePhase1Data(
        parseInt(sessionId),
        req.user,
        { brandName, brandDescription},
        {branchName},
        {street_address, pincode, city_id, latitude, longitude}
    );

    console.log(`---4.session updated as data of phase-1 is saved--- `);
    
    return res.status(200).json(
        new ApiResponse(200,updatedSession,"Phase 1 data saved succeefully")
    );

})

export const submitPhase2Data = asyncHandler(async (req,res) => {
    // verify the session-id
    const {sessionId} = req.params;
    // 1.Extract text based data from req.body
    // when sending multiparts, arrays and objects are passed as JSON strings and need to be parsed on the backend
    console.log(`Session id fetched from url: ${sessionId}`);
    
    const {cuisineIds, deliveryTimings, orderDevice} = req.body;
    // 2.Extract uploaded files from req.file
    const menuImageLocalPath = req.files?.menuImage?.[0]?.path;
    const restaurantProfileImageLocalPath = req.files?.restaurantProfileImage?.[0]?.path;

    if(!menuImageLocalPath || !restaurantProfileImageLocalPath){
        throw new ApiError(400,"menu image and restaurant profile image are required fields")
    }

    // 3.Perform validations.
    if(!cuisineIds || !deliveryTimings || !orderDevice) {
        throw new ApiError(400, "Cuisines, delivery timings, and order device are required");
    }
    // 4.Prepare a strcutured data object to pass it to the service to save it. 
    let parsedCuisineIds = [];
    let parsedDeliveryTimings = [];
    try {
        if(cuisineIds) parsedCuisineIds = JSON.parse(cuisineIds);
        if([parsedDeliveryTimings]) parsedDeliveryTimings = JSON.parse(deliveryTimings);
    } catch (error) {
        throw new ApiError(400, "Invalid JSON format for cuisineIds or delivery timings");
    }
    const phase2Data = {
        cuisineIds: parsedCuisineIds,
        deliveryTimings: parsedDeliveryTimings,
        orderDevice,
        menuImageLocalPath,
        restaurantProfileImageLocalPath
    }
    // 5.Delegate the complex upload and database logic to the server layer.
    const updateSession = await savePhase2Data(parseInt(sessionId),phase2Data)
    //  6. Send a successful response.
    return res.status(200).json(
        new ApiResponse(200,updateSession, "Phase 2 data saved successfully")
    );
})

export const submitPhase3Data = asyncHandler(async (req,res) => {
    // 1.Get the sessionId from the url. canAccessOnboardingSession middleware has already verified that the logged-in user owns the session
    const {sessionId} = req.params;
    // 2.Securely get the manager's Id from the authenticated user
    const managerId = req.user.id;
    // 3.extract the banking details from the request body.
    const {accountNumber, ifscCode, accountType} = req.body;
    // 4.Perform validation
    if(!accountNumber || !ifscCode || !accountType) throw new ApiError(409,"account number, ifs code and accountType are required.");
    // 5.Delegate the complex database logic to the service
    const updatedSession = await savePhase3Data(
        parseInt(sessionId),    
        managerId,
        {accountNumber, ifscCode, accountType}
    );
    if(!updatedSession){
        throw new ApiError(400,"session failed to update (phase-3)");
    }
    console.log(updatedSession);
    
    // send successful response. 
    res.status(200).json(new ApiResponse(200,updatedSession,"Phase 3 Data saved successfully"))

})