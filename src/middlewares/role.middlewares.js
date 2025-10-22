import prisma from "../db/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const BRAND_MANAGER_ROLE_ID = 2;
const BRANCH_MANAGER_ROLE_ID = 4;

export const canAccessMenuCategory = asyncHandler(async (req,_,next) => {
    const {categoryId} = req.params;
    const managerId = req.user.id;

    if(!categoryId) throw new ApiError(400,"categoryId is required");

    const category = await prisma.branchMenuCategories.findUnique({
        where: {id: parseInt(categoryId)},
        select:{branch_id:true}
    });

    if(!category){
        throw new ApiError(404,"Menu ")
    }

    const branch = await prisma.restaurantBranches.findUnique({
        where:{id: category.branch_id},
        select:{ user_id:true}
    });

    if(branch?.user_id !== managerId) throw new ApiError(403,"Forbidden: You do not have permission to access this category.");

    // attach the branchId to the request so that the controller can access it
    req.branchId = category.branch_id;
    next();
})

export const canAccessMenuItems = asyncHandler(async (req,_,next) => {
    const {itemId} = req.params;
    const managerId = req.user.id;

    if(!itemId) throw new ApiError(400, "Menu item ID is required.");

    const menuItem = await prisma.branchMenuItems.findUnique({
        where: {id: parseInt(itemId)},
        select: {
            category: {
                select : {
                    branch_id : true,
                }
            }
        }
    });

    if(!menuItem) throw new ApiError(404,"Menu item not found");

    const branch = await prisma.restaurantBranches.findUnique({
        where: {
            id: menuItem.category.branch_id,
        },
        select:{
            user_id:true,
        }
    });

    if(branch?.user_id !== managerId) throw new ApiError(403,"Forbidden: You do not have permission to modify this menu item.");

    // Attach the branch id to the request so that the controllers can access it
    req.branchId = menuItem.category.branch_id;
    next();
})

export const canAccessBranch = asyncHandler(async (req,_,next) => {
    // get id of the branch ,the user trying to get the access of
    const {branchId} = req.params;

    // get id of the currently loggedin user from the req.user
    const managerId = req.user?.id;

    // validation
    if(!branchId) throw new ApiError(400,"Branch Id required in the URL parameter");

    if(!managerId) throw new ApiError(401,"Unauthorized: User not authenticated");

    // query the db to find the branch.
    const branch = await prisma.restaurantBranches.findUnique({
        where:{
            id: parseInt(branchId),
        },
        select: {
            user_id: true,
        },
    });
    
    // security check:
    // if branch doesnt exist or if its owner Id does not match the id of the person making the request then deny it
    if(!branch || branch.user_id !== managerId) throw new ApiError(403, "Forbidden: You do not have permission to access this branch.");

    next();
})

export const isBrandManager = asyncHandler(async (req,_,next) => {
    const userRole = await prisma.userHasRoles.findUnique({
        where: {
            user_id: req.user?.id,
            role_id: BRAND_MANAGER_ROLE_ID
        }
    });

    if(!userRole){
        throw new ApiError(403,"Forbidden: Access denied. Brand Manager role required");
    }
    next();
});


export const isBranchManager = asyncHandler(async (req,_,next) => {
    const userRole = await prisma.userHasRoles.findUnique({
        where: {
            user_id: req.user?.id,
            role_id: BRANCH_MANAGER_ROLE_ID
        }
    });
    if (!userRole) {
        throw new ApiError(403, "Forbidden: Access denied. Branch Manager role required.");
    }
    next();
})

export const isPartner = asyncHandler(async (req, _, next) => {
    console.log("\n--- 1. 'isPartner' middleware started ---");
    const userId = req.user?.id;
    if(!userId) throw new ApiError(500,"User id not recieved at isPartner middlware")
    console.log(`--- 2. Checking permissions for User ID: ${userId} ---`);
    const userRoles = await prisma.userHasRoles.findMany({
        where: {
            user_id: userId,
            role_id: { in: [BRAND_MANAGER_ROLE_ID, BRANCH_MANAGER_ROLE_ID] }
        }
    });
     console.log(`--- 3. Found partner roles:`, userRoles, `---`);
    if (userRoles.length === 0) {
        console.log("--- 4. FAILED: User is not a partner. Denying access. ---\n");
        throw new ApiError(403, "Forbidden: Access denied. Partner role required.");
    }
    console.log("--- 4. SUCCESS: User is a partner. Granting access. ---\n");
    next();
});

// verify the loggedin user the owner of the onboarding

export const canAcessOnboardingSession = asyncHandler(async (req,_,next) => {
    const {sessionId} = req.params;
    const userId = req.user?.id;

    if(!sessionId) throw new ApiError(400,"Session ID is required");

    // find onboarding session in the db
    const session = await prisma.onboardingSession.findUnique({
        where: {
            id: parseInt(sessionId),
        }
    });

    if(!session || session.manager_id !== userId) throw new ApiError(403,"Forbidden: You do not have permission to access this resource.")


    req.session = session;
    console.log("---can access onboardingsession---");
    
    next();
})