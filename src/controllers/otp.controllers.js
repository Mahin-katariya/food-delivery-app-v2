import prisma from "../db/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { comparePassword, hashPassword } from "../services/hashingPassword.services.js";
import { twilioClient } from "../services/sms.service.js";

export const generateAndSendOTP = asyncHandler(async (req,res) => {
    const {phone_number} = req.body;
    if(!phone_number){
        throw new ApiError(400,"Phone number is required;")
    }

    const user = await prisma.user.findFirst({where: {phone_number}});
    if(!user) throw new ApiError(404,"User with this phone number not found!");

    const otpCode = Math.floor(100000 + Math.random()* 900000).toString();
    const hashedOtp = await hashPassword(otpCode);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.userOTP.create({
        data:{
            user_id:user.id,
            otp_code:hashedOtp,
            status:'pending',
            expires_at:expiresAt
        }
    });

    if(twilioClient){
        try {
            await twilioClient.messages.create({
                body: `Your verification code is: ${otpCode} `,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone_number
            })
        } catch (error) {
            console.log("Twilio error:",error);
            throw new ApiError(500,"Failed to send OTP via SMS");
            
        }
    }else{
        // 
    }
    
    res.status(200).json(new ApiResponse(200,null,"OTP sent successfully."));
})

export const verifyOTP = asyncHandler(async (req,res) => {
    const {phone_number, otpCode} = req.body;
    if(!phone_number || !otpCode) throw new ApiError(400,"Phone number and OTP is required");

    const user = await prisma.user.findFirst({
        where: {phone_number},
    });
    if(!user) throw new ApiError(404,"User not found.");

    const userOtpRecord = await prisma.userOTP.findFirst({
        where: {
            user_id:user.id,
            status:"pending"
        },
        orderBy: {created_at:'desc'}
    });

    if(!userOtpRecord) throw new ApiError(400,"No pending otp found for the user");

    if(new Date() > userOtpRecord.expires_at){
        await prisma.userOTP.update({
            where: {
                id:userOtpRecord.id
            },
            data: {
                status:'expired'
            }
        });
        throw new ApiError(400,"OTP is expired");
    }

    const isMatch = await comparePassword(otpCode,userOtpRecord.otp_code);
    if(!isMatch) throw new ApiError(400,"invalid OTP");

    await prisma.$transaction([
        prisma.user.update({where: {id:user.id},data:{phone_verifier_at: new Date()}}),
        prisma.userOTP.update({where: {id: userOtpRecord.id},data:{status:"verified"}})
    ])

    res.status(200).json(new ApiResponse(200,null,"Phone number verified successfully"));

})