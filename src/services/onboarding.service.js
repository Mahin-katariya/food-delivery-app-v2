
import { week_day } from "@prisma/client";
import prisma from "../db/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { encrypt } from "../utils/encryption.js";

export async function createSession(managerId){
    // A user should not have multiple incomplete applciations
    // check if the user has an active or incomplete session.
    console.log("--- 4a. Inside 'createSession' service ---");

    console.log(`--- 4b. Searching for existing incomplete session for managerId: ${managerId} ---`);
    const existingSession = await prisma.onboardingSession.findFirst({
        where: {
            manager_id: managerId,
            // NOT : {
            //     status:'COMPLETED'
            // }
            status :{
                not : 'COMPLETE'
            }
        }
    });
    
    // if an incomplete session exists return to that one instead of creating a new one.
    if(existingSession){
        console.log("--- 4c. Found existing session. Returning it. ---", existingSession);
        return existingSession;
    };
    console.log("--- 4c. No existing session found. Creating a new one. ---");
    // if no active session found then create a new one
    const newSession = await prisma.onboardingSession.create({
        data: {
            manager_id: managerId,
        }
    });

    if(!newSession) throw new ApiError(500,"Failed to create on onboarding session.");
    console.log("--- 4d. New session created successfully. ---", newSession);
    return newSession

}


// service to save the phase-1 onboarding data.
export async function savePhase1Data(sessionId,user,brandData,branchData,addressData){
    const BRAND_MANAGER_ROLE_ID = 2;
    console.log("---1. entered savePhase1Data service---");
    
    const updatedSession = await prisma.$transaction(async (tx) => {
        console.log("---2.entered the updated Session transaction---");
        
        // we'll check if the user has brand_manager role
        const isBrandManager = await tx.userHasRoles.findUnique({
            where:{
                user_id_role_id:{
                    user_id:user.id,
                    role_id:BRAND_MANAGER_ROLE_ID
                }
            }
        });

        console.log(`---2a.isBrandManager : ${isBrandManager}---`);
        

        const newAddress = await tx.address.create({
            data :{
                street_address: addressData.street_address,
                pincode: addressData.pincode,
                city_id: addressData.city_id,
                latitude: addressData.latitude || 0,
                longitude: addressData.longitude || 0
            }
        });

        console.log(`---2b.newAddress : ${newAddress}---`);


        let brandId;

        // Determine if we need to create a new brand
        console.log("---2c. create Brand(Restaurant) ---");
        
        if(isBrandManager){
            console.log("Entered is brandManager check");
            console.log(brandData);
            console.log(user.id);
            
            const newBrand = await tx.restaurantBrands.create({
                data: {
                    name: brandData.brandName,
                    description: brandData.brandDescription || null,
                    manager_id: user.id
                }
            });

            brandId = newBrand.id;
            console.log(`created newBrand : ${newBrand}`);
            
        }else{
            // If the user is branch manage, they must have specified which brand they are joining.
            // handled by building a join a brand flow
            throw new ApiError(500,'Joining a existing brand is not yet implemented');
        }
        console.log("---2d.NEW BRAND RESTAURANT CREATED---");
        
        // we'll always be creating a branch record as the first brand will also be alloted a branch too.
        console.log("---2e.New Branch restaurant creating---");
        console.log(newAddress);
        const newBranch = await tx.restaurantBranches.create({
            data: {
                brand_id:brandId,
                user_id:user.id,
                address_id: newAddress.id,
                branch_name: branchData.branchName,
            }
        });
        console.log("---2f.NEW BRANCH RESTAURANT CREATED---");

        console.log("---2g. UPDATE THE ONBOARDING SESSION STATUS---");
        
        // finally in the end we update the onboardingSession
        const session = await tx.onboardingSession.update({
            where: {id:sessionId},
            data: {
                status:'PHASE_1_COMPLETE',
                branch_id: newBranch.id,
            }
        })
        console.log("---2h. ONBOARDING STATUS UPDATED---");
        
        return session;
    });

    if(!updatedSession) throw new ApiError(500,"Failed to save Phase1 data.");

    return updatedSession;
}

// Handles file uploads to Cloudinary first, then saves all data in a single transaction.
export async function savePhase2Data(sessionId, data) {
    console.log("[savePhase2Data] called with sessionId:", sessionId);
    console.log("[savePhase2Data] raw data received:", data);

    // 1. destructure
    const { cuisineIds, deliveryTimings, orderDevice, menuImageLocalPath, restaurantProfileImageLocalPath } = data;
    console.log("[savePhase2Data] destructured data:", {
        cuisineIds,
        deliveryTimings,
        orderDevice,
        menuImageLocalPath,
        restaurantProfileImageLocalPath
    });

    // 2. file uploads
    let menuImageUrl = null;
    if (menuImageLocalPath) {
        console.log("[savePhase2Data] uploading menu image from:", menuImageLocalPath);
        const menuUploadResult = await uploadOnCloudinary(menuImageLocalPath);
        console.log("[savePhase2Data] menuUploadResult:", menuUploadResult);
        if (!menuUploadResult) throw new ApiError(500, "Failed to upload menu image.");
        menuImageUrl = menuUploadResult.url;
    }

    let restaurantProfileImageUrl = null;
    if (restaurantProfileImageLocalPath) {
        console.log("[savePhase2Data] uploading restaurant profile image from:", restaurantProfileImageLocalPath);
        const restaurantProfileUploadResult = await uploadOnCloudinary(restaurantProfileImageLocalPath);
        console.log("[savePhase2Data] restaurantProfileUploadResult:", restaurantProfileUploadResult);
        if (!restaurantProfileUploadResult) throw new ApiError(500, "Failed to upload restaurant profile image.");
        restaurantProfileImageUrl = restaurantProfileUploadResult.url;
    }

    // 3. transaction
    const updatedSession = await prisma.$transaction(async (tx) => {
        console.log("[savePhase2Data] starting transaction");

        // get session
        const session = await tx.onboardingSession.findUnique({
            where: { id: sessionId },
            select: { branch_id: true }
        });
        console.log("[savePhase2Data] fetched session:", session);
        if (!session || !session.branch_id) {
            console.error("[savePhase2Data] Invalid session or no branch_id");
            throw new ApiError(404, "Invalid session or brand not created yet");
        }
        const branchId = session.branch_id;

        // get branch
        const branch = await tx.restaurantBranches.findUnique({
            where: { id: branchId },
            select: { brand_id: true }
        });
        console.log("[savePhase2Data] fetched branch:", branch);
        if (!branch) {
            console.error("[savePhase2Data] Branch not found for branchId:", branchId);
            throw new ApiError(404, "The branch associated with this session could not be found");
        }
        const brandId = branch.brand_id;

        // brand update
        if (restaurantProfileImageUrl) {
            console.log("[savePhase2Data] updating brand logo:", { brandId, restaurantProfileImageUrl });
            await tx.restaurantBrands.update({
                where: { id: brandId },
                data: { logo_url: restaurantProfileImageUrl }
            });
        }

        // branch update
        console.log("[savePhase2Data] updating branch:", { branchId, menuImageUrl, orderDevice });
        await tx.restaurantBranches.update({
            where: { id: branchId },
            data: {
                menu_image_url: menuImageUrl,
                order_devices: orderDevice
            }
        });

        // cuisines
        if (cuisineIds && cuisineIds.length > 0) {
            console.log("[savePhase2Data] linking cuisines:", cuisineIds);
            await tx.branchCuisines.createMany({
                data: cuisineIds.map(cuisineId => ({
                    branch_id: branchId,
                    cuisine_id: cuisineId
                })),
                skipDuplicates: true
            }); 
        } else {
            console.error("[savePhase2Data] No cuisines selected");
            throw new ApiError(409, "Select atleast 1 cuisine");
        }

        // timings
        console.log(deliveryTimings.length);
        
        if (deliveryTimings && deliveryTimings.length > 0) {
            console.log("[savePhase2Data] replacing delivery timings:", deliveryTimings);
            await tx.restaurantTimings.deleteMany({ where: { branch_id: branchId } });

            await tx.restaurantTimings.createMany({
                data: deliveryTimings.map(timing => ({
                    branch_id: branchId,
                    weekDay: timing.weekDay,
                    start_time: new Date(timing.start_time),
                    end_time: new Date(timing.end_time)
                }))
            });
        } else {
            console.error("[savePhase2Data] No delivery timings provided");
            throw new ApiError(409, "Select timings for atleast 1 day");
        }

        // update session status
        console.log("[savePhase2Data] marking session as PHASE_2_COMPLETE:", sessionId);
        const updated = await tx.onboardingSession.update({
            where: { id: sessionId },
            data: { status: "PHASE_2_COMPLETE" }
        });
        console.log("[savePhase2Data] updated session:", updated);

        return updated;
    });

    console.log("[savePhase2Data] transaction complete, returning:", updatedSession);
    return updatedSession;
}

// Securely saves the partner's banking information and updates their progress.
export async function savePhase3Data(sessionId,managerId,data){
    const { accountNumber, ifscCode, accountType } = data;
    console.log("---1.Entered the savePhase3Data");
    
    // Perform all database writes in a single, atomic transaction.
    const completedSession = await prisma.$transaction(async (tx) => {
        console.log('--2.Entered transaction safely--');
        
        // 1. Get the context: Find the session to get the branch_id.
        const session = await tx.onboardingSession.findUnique({
            where: { id: sessionId },
            select: { branch_id: true }
        });
        if (!session || !session.branch_id) {
            throw new ApiError(404, "Onboarding session or its associated branch not found. Please complete previous steps.");
        }
        console.log(`session exists! ${session}`);
        
        const branchId = session.branch_id;

        // 2. Securely encrypt the account number before it touches the database.
        const encryptedAccountNumber = encrypt(accountNumber);
        const encryptedIfsc = encrypt(ifscCode)
        // 3. Securely save the bank account details, linked to the unique branch.
        // This 'upsert' prevents duplicates and allows for corrections.
        console.log('--Update/Create brankAccount for the onboarding parter: --');
        
        await tx.userBankAccount.upsert({
            where: {
                branch_id: branchId, // The unique identifier is the branch.
            },
            update: {
                account_number: encryptedAccountNumber,
                ifsc_code: encryptedIfsc,
                account_type: accountType,
                user_id: managerId,
            },
            create: {
                user_id: managerId,
                branch_id: branchId, // Link to the specific branch.
                account_number: encryptedAccountNumber,
                ifsc_code: encryptedIfsc,
                account_type: accountType,
            }
        });

        console.log("--Account created!--");
        
        // 4. --- "GO-LIVE" LOGIC ---
        // Activate the branch by changing its status from 'draft' to 'active'.
        console.log("--Update the status in restaurantBranches");
        
        await tx.restaurantBranches.update({
            where: { id: branchId },
            data: { status: 'active' }
        });

        console.log("--The status of restaurant in restaurantBranches updatesd successfully--");
        
        // The Brand's status can be managed separately or updated here if needed.
        // For now, we focus on activating the Branch as per our "Branch-First" model.
        
        console.log("--Update the onboardingSession status--");
        // 5. The final step is to update the session status to mark it as fully COMPLETED.
        return tx.onboardingSession.update({
            where: { id: sessionId },
            data: { status: 'COMPLETE' }
        });

        // console.log("--Session status updated successfully");
        
    });

    if (!completedSession) {
        throw new ApiError(500, "Failed to complete the onboarding process.");
    }

    return completedSession;
}