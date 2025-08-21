import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
import Api from "twilio/lib/rest/Api";

export const verifyJWT = asyncHandler(async (req,_,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");

        if(!token) throw new ApiError(401,"Unauthorized request");

        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

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

        if(!user) throw new ApiError(404,"Invalid Access Token");

        req.user = user;
        next();
    } catch (error) {
        
    }
})