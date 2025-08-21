import Api from "twilio/lib/rest/Api.js";
import prisma from "../db/prisma.js";
import { generateAndStoreTokens } from "../services/auth.service.js";
import { comparePassword, hashPassword } from "../services/hashingPassword.services.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const roleMap = {
    0: 'admin',
    1: 'customer',
    2: 'restaurant_owner',
    3: 'delivery_agent',
}

export const registerUser = asyncHandler(async (req,res) => {
    // 1. Input validation
    const {email,password,firstname,lastname="",phone_number,role_id} = req.body;

    if([email,password,firstname,phone_number].some((f) => f?.trim() === "") || role_id === undefined){
        throw new ApiError(400,"Fill all the required Fields!");
    }

    // 2.validate role_id with backend
    const role_name = roleMap[role_id];
    if(!role_name){
        throw new ApiError(400,"Invalid roleId provided from the frontend.");
    }

    // 3. check if a user exists with the same phone number.
    const existingUser = await prisma.user.findFirst({
        where: {phone_number},
    });

    

    /* !!! If a user exists and creates an account with another role his password will still be the same which is kind of an issue we will look into !!! */
    if(existingUser) {
    // 3a. check if the user with the same phone number has the same role
        const existingRole = await prisma.userHasRoles.findUnique({
            where:{
                user_id_role_id: {
                    user_id:existingUser.id,
                    role_id:role_id,
                }
            }
        });

        if(existingRole){

            if (existingUser.phone_verifier_at === null){
                throw new ApiError(409,"An unverified account already exists. Please verify your phone number to continue.");
            }else{
                throw new ApiError(409,"An account with this phone number and role already exists.")
            }
        }

    // 3b. User exist but is registering for a new role.
        await prisma.userHasRoles.create({
            data: {user_id:existingUser.id,role_id:role_id}
        });

        const userWithRoles =  {...existingUser, roles:[{role_id:role_id}] };
        const {accessToken, refreshToken} = await generateAndStoreTokens(userWithRoles,req);
        const {password:_,...userResponse} = existingUser;
        
        const responseData = {
            user: userResponse,
            accessToken,
            refreshToken
        }

        return res.status(200).json(new ApiResponse(200,responseData,"Account created with another role!"));
    }

    // 4. User does not exists.
    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.$transaction(async (accountSetup) => {
        await accountSetup.userRoles.upsert({
            where:{id:role_id},
            update:{},
            create:{id: role_id,role_name:role_name},
        });

        const user = await accountSetup.user.create({
            data:{
                email,
                password:hashedPassword,
                firstname,
                lastname,
                phone_number
            }
        });

        await accountSetup.userHasRoles.create({
            data: {
                user_id:user.id,
                role_id:role_id
            }
        });
        return user;
    })

    const userWithRole = {...newUser,roles:[{role_id:role_id}]};
    const {acccessToken,refreshToken} = await generateAndStoreTokens(userWithRole,req);
    const {password:_,...userResponse} = newUser;
    const responseData = {
        user: userResponse,
        acccessToken,
        refreshToken
    }

    return res.status(201).json(new ApiResponse(201,responseData,"Registered Successfully"));
})

export const loginUser = asyncHandler(async (req,res) => {
    const {password,phone_number,roleId} = req.body;

    if(!phone_number  || !password || roleId === undefined){
        throw new ApiError(400,"Phone number, password required and roleID(developer)");
    }

    const user = await prisma.user.findFirst({
        where:{
            phone_number,
        }
    });

    if(!user){
        throw new ApiError(404,"User not found!");
    }

    const userRole = await prisma.userHasRoles.findUnique({
        where: {
            user_id_role_id:{
                user_id:user.id,
                role_id:roleId
            }
        }
    });

    if(!userRole) throw new ApiError("User does not have the requested role. Invalid credentials");


    if(!user.phone_verifier_at) throw new ApiError("phone number not verified, plss complete the otp verification!");

    const isPasswordValid = await comparePassword(password,user.password);
    if(!isPasswordValid) throw new ApiError(401,"Invalid password");

    const userWithRole = {...user,roles:[{role_id:roleId}]};
    const {acccessToken,refreshToken} = await generateAndStoreTokens(userWithRole,req);

    const {password:_,...userResponse} = user;
    const responseData = {
        user:userResponse,
        acccessToken,
        refreshToken
    }

    res.status(200).json(new ApiResponse(200,responseData,"User logged in successfully"));


})

// have to make refreshAccessToken controller in future.