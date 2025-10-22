import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";


export const verifyJWT = asyncHandler(async (req,_,next) => {
    try {
                console.log("\n--- 1. verifyJWT middleware started ---");
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");

        if(!token) throw new ApiError(401,"Unauthorized request");
        console.log("--- 2. Token found ---");

        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        console.log("--- 3. Token verified successfully ---");

        console.log(`--- 4. Searching for user with ID: ${decodedToken?.id} ---`);
        const user = await prisma.user.findUnique({
            where:{
                id:decodedToken?.id,
            },
            select:{
                id:true,
                email:true,
                firstname:true
            }
        });
        console.log("--- 5. Database query finished ---");
        if(!user) throw new ApiError(404,"Invalid Access Token");
        console.log("--- 6. User found in database ---");
        req.user = user;
        next();
        console.log("--- 7. verifyJWT middleware finished successfully ---\n");
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token.");
    }
})