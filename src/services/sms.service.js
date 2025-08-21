import twilio from 'twilio';
import { ApiError } from '../utils/ApiError.js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if(!accountSid || !authToken){
    throw new ApiError(500,"Twilio credentials are not configured in the .env file.");
}

export const twilioClient = twilio(accountSid,authToken);