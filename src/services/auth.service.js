import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';
import { ApiError } from '../utils/ApiError.js';


export async function generateAndStoreTokens(user,req,roleId){
    const accessTokenPayload = {id:user.id,firstname:user.firstname,phone:user.phone_number};
    const refreshTokenPayload = {id:user.id};

    const accessToken = jwt.sign(
        accessTokenPayload,
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn:process.env.ACCESS_TOKEN_EXPIRY}
    )

    const refreshToken = jwt.sign(
        refreshTokenPayload,
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn:process.env.REFRESH_TOKEN_EXPIRY}
    )

    if(roleId === undefined){
        throw new ApiError(500,`User with ID ${user.id} has no role assigned for this session`);
    }

    const expiresAt = new Date(Date.now() + parseInt(process.env.REFRESH_TOKEN_EXPIRY_MS));
    console.log(expiresAt);
    
    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.socket.remoteAddress;

    await prisma.refreshTokens.create({
        data: {
            user_id:user.id,
            refresh_token:refreshToken,
            role_id:roleId,
            device_info:deviceInfo,
            ip_address:ipAddress,
            expires_at:expiresAt
        }
    });

    return {accessToken,refreshToken};
}

