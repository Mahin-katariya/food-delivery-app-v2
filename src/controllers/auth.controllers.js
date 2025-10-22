import prisma from "../db/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { comparePassword, hashPassword } from "../services/hashingPassword.service.js";
import { twilioClient } from "../services/sms.service.js";
import jwt from 'jsonwebtoken'
import { generateAndStoreTokens } from "../services/auth.service.js";

const OTP_COOLDOWN_PERIOD_MS=60*1000;



// export const generateAndSendOTP = asyncHandler(async (req,res) => {
//     const {phone_number} = req.body;
//     if(!phone_number){
//         throw new ApiError(400,"Phone number is required;")
//     }

//     const user = await prisma.user.findFirst({where: {phone_number}});
//     if(!user) throw new ApiError(404,"User with this phone number not found!");


//     const latestOtp = await prisma.userOTP.findFirst({
//         where: {user_id: user.id},
//         orderBy: {created_at: 'desc'}
//     });

//     if(latestOtp) {
//         const timeSinceLastOtp = Date.now() - latestOtp.created_at.getTime();


//         if(timeSinceLastOtp < OTP_COOLDOWN_PERIOD){
//             const timeLeft = Math.ceil((OTP_COOLDOWN_PERIOD - timeSinceLastOtp)/ 1000);
//             throw new ApiError(429,`Please wait ${timeLeft} more seconds before requesting another OTP. `);
//         }
//     }

//     const otpCode = Math.floor(100000 + Math.random()* 900000).toString();
//     const hashedOtp = await hashPassword(otpCode);
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

//     await prisma.userOTP.create({
//         data:{
//             user_id:user.id,
//             otp_code:hashedOtp,
//             status:'pending',
//             expires_at:expiresAt
//         }
//     });

//     if(twilioClient){
//         try {
//             await twilioClient.messages.create({
//                 body: `Your verification code from Tastebox is: ${otpCode} `,
//                 from: process.env.TWILIO_PHONE_NUMBER,
//                 to: phone_number
//             })
//         } catch (error) {
//             console.log("Twilio error:",error);
//             throw new ApiError(500,"Failed to send OTP via SMS");
            
//         }
//     }else{
//         // 
//     }
    
//     res.status(200).json(new ApiResponse(200,null,"OTP sent successfully."));
// })

// export const verifyOTP = asyncHandler(async (req,res) => {
//     const {phone_number, otpCode} = req.body;
//     if(!phone_number || !otpCode) throw new ApiError(400,"Phone number and OTP is required");



//     const user = await prisma.user.findFirst({
//         where: {phone_number},
//     });
//     if(!user) throw new ApiError(404,"User not found.");

//     const userOtpRecord = await prisma.userOTP.findFirst({
//         where: {
//             user_id:user.id,
//             status:"pending"
//         },
//         orderBy: {created_at:'desc'}
//     });

//     if(!userOtpRecord) throw new ApiError(400,"No pending otp found for the user");

//     if(new Date() > userOtpRecord.expires_at){
//         await prisma.userOTP.update({
//             where: {
//                 id:userOtpRecord.id
//             },
//             data: {
//                 status:'expired'
//             }
//         });
//         throw new ApiError(400,"OTP is expired");
//     }

//     const isMatch = await comparePassword(otpCode,userOtpRecord.otp_code);
//     if(!isMatch) throw new ApiError(400,"invalid OTP");

//     await prisma.$transaction([
//         prisma.user.update({where: {id:user.id},data:{phone_verifier_at: new Date()}}),
//         prisma.userOTP.update({where: {id: userOtpRecord.id},data:{status:"verified"}})
//     ])

//     res.status(200).json(new ApiResponse(200,null,"Phone number verified successfully"));

// })

export const sendOtpController = asyncHandler(async (req,res) => {
    // 1.get phone number and users intent login or register.
    const { phone_number, intent } = req.body;

    if(!phone_number || !intent) {
        throw new ApiError(400,"Phone number and intent (login or register) are required.");
    }

    // Rate Limiting
    const latestOtp = await prisma.userOTP.findFirst({
        where: {phone_number},
        orderBy: {created_at: 'desc'}
    });

    if(latestOtp){
        //calculate the time in miliseconds that has passed since the otp has been sent
        const timeSinceLastOtp = Date.now() - latestOtp.created_at.getTime(); 
        if(timeSinceLastOtp < OTP_COOLDOWN_PERIOD_MS){
            const timeLeft = Math.ceil((OTP_COOLDOWN_PERIOD_MS - timeSinceLastOtp)/1000);
            throw new ApiError(429,`Please wait ${timeLeft} more seconds before requesting another otp.`);
        }
    }
    // 2.perform check based on the user's intent.
    const user = await prisma.user.findFirst({where: {phone_number}});

    if(intent.toLowerCase() == "login" && !user ){
        // intent is login toh user should exist and if it does not send a message of no account found with this ph number.
        throw new ApiError(404,"No account found with this phone number. Please create an account first.");
    }else if(intent.toLowerCase() == 'register' && user){
        // if intent is register toh user must not exist, if it does then login please.
        throw new ApiError(404,"An account with this phone number already exists.Please Login In.");
    }

    // 3. Otp generation and hashing of the otp
    const otpCode =  Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await hashPassword(otpCode);
    const expiresAt = new Date(Date.now() +  5 * 60 * 1000); //5 minute expiry

    const otpResponse = await prisma.userOTP.create({
        data: {
            phone_number: phone_number,
            user_id: user ? user.id : null,
            otp_code: hashedOtp,
            expires_at:expiresAt
        },
        select: {
            id:true,
            phone_number:true,
            created_at:true,
            expires_at:true,
            status:true,
        }
    });

    if(twilioClient){
        try {
            await twilioClient.messages.create({
                body: `Your verification code from tastebox is : ${otpCode}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to:"+91"+phone_number
            })
        } catch (error) {
            console.log("Twilio Error: ",error);
            throw new ApiError(500,"Failed to send otp via SMS")
            
        }
    }else{
        console.log(`Otp for ${phone_number} with intent ${intent} is ${otpCode}`);
    }

    return res.status(200).json(new ApiResponse(200,otpResponse,"Otp was sent succesfully"));
})

// export const loginWithOtpController = asyncHandler(async (req,res) => {

//     const {phone_number, otpCode} = req.body;
//     if(!phone_number || !otpCode){
//         throw new ApiError(400,"Phone number and OTP required.");
//     }

//     // login, user must exist when logging in
//     const user = await prisma.user.findFirst({where: {phone_number}});
//     if(!user){
//         throw new ApiError(404,"User not found. Please create an account.");
//     }

//     // 3. Verify an Otp. This is the primary security gate.
//     const userOtpRecord = await prisma.userOTP.findFirst({
//         where: {
//             phone_number:phone_number,
//             user_id: user.id,
//             status: "pending"
//         },
//         orderBy: {created_at: 'desc'}
//     });

//     // Check if OTP record exists, is not expired, and the code matches.
//     if(!userOtpRecord || new Date() > userOtpRecord.expires_at || !(await comparePassword(otpCode,userOtpRecord.otp_code))){

//         if(userOtpRecord){
//             await prisma.userOTP.update({where: {id:userOtpRecord.id},data:{status:'expired'}});
//         }
//         throw new ApiError(401,"invalid or expired OTP.")
//     }

//     // 4. Marking the otp as used to prevent replay attacks.
//     await prisma.userOTP.update({where:{id:userOtpRecord.id},data:{status:'verified'}});


//     // 5.check the user's status by checking their role.
//     const BRAND_MANAGER_ROLE_ID = 2;
//     const isBrandManager = await prisma.userHasRoles.findUnique({
//         where:{
//             user_id_role_id:{
//                 user_id:user.id,
//                 role_id:BRAND_MANAGER_ROLE_ID
//             }
//         }
//     });


//     const {accessToken, refreshToken} = await generateAndSendOTP(user,req);
//     const {password:_,...userResponse} = user;

//     // Scenario 1 & 2: User is a brand Manager.
//     if(isBrandManager) {
//         const session = await prisma.onboardingSession.findFirst({
//             where:{manager_id:user.id},
//             orderBy:{created_at:'desc'}
//         });

//         // scenario-2: partially registered restaurant.
//         if(session && session.status !== 'COMPLETED') {
//             const responseData = {status: 'ONBOARDING_INCOMPLETE', onboardingStatus: session.status, user: userResponse, accessToken,refreshToken};
//             return res.status(200).json(new ApiResponse(200,responseData,"Welcome back! Continuing your application"));
//         }
//         // scenario-1: Already a fully registed restaurant partner.
//         const responseData = {status: "LOGIN_SUCCESSFUL_PARTNER", user:userResponse, accessToken, refreshToken};
//         return res.status(200).json(new ApiResponse(200,responseData,"Partner login successful"));
//     }

//     // scenario-3 : a non-partner user logging in for example: customer.
//     const responseData = {status:"LOGIN_SUCCESSFUL_NEW_PARTNER",user: userResponse,accessToken,refreshToken};
//     return res.status(200).json(new ApiResponse(200,responseData,"Login successful. Welcome to the partner program."))
// });
export const loginWithOtpController = asyncHandler(async (req, res) => {
    // 1. Get credentials, now including the user's login intent (roleId).
    const { phone_number, otpCode, roleId } = req.body;
    if (!phone_number || !otpCode || roleId === undefined) {
        throw new ApiError(400, "Phone number, OTP, and roleId are required.");
    }

    // 2. Find the user. For login, the user must exist.
    const user = await prisma.user.findFirst({ where: { phone_number } });
    if (!user) {
        throw new ApiError(404, "User not found. Please create an account.");
    }

    // 3. Verify the OTP. This is the primary security gate.
    const userOtpRecord = await prisma.userOTP.findFirst({
        where: {
            phone_number: phone_number,
            user_id: user.id,
            status: "pending"
        },
        orderBy: { created_at: 'desc' }
    });

    if (!userOtpRecord || new Date() > userOtpRecord.expires_at || !(await comparePassword(otpCode, userOtpRecord.otp_code))) {
        if (userOtpRecord) {
            await prisma.userOTP.update({ where: { id: userOtpRecord.id }, data: { status: 'expired' } });
        }
        throw new ApiError(401, "Invalid or expired OTP.");
    }

    // 4. Mark the OTP as used to prevent replay attacks.
    await prisma.userOTP.update({ where: { id: userOtpRecord.id }, data: { status: 'verified' } });


    // --- 5. THE NEW, SUPERIOR LOGIC: The Permission Check ---
    // Instead of guessing the role, we now verify that the authenticated user
    // has the specific role they are requesting to log in with.
    const hasPermission = await prisma.userHasRoles.findUnique({
        where: {
            user_id_role_id: {
                user_id: user.id,
                role_id: roleId // The roleId from the request body
            }
        }
    });

    if (!hasPermission) {
        throw new ApiError(403, "Forbidden. Your account does not have the required permissions to access this service.");
    }
    // --- End of New Logic ---

    // 6. Generate tokens and a safe user response object.
    // We now pass the verified roleId directly to the service.
    const { accessToken, refreshToken } = await generateAndStoreTokens(user, req, roleId);
    const { password: _, ...userResponse } = user;
    
    // 7. The decision tree now checks the verified roleId to determine the response.
    const BRAND_MANAGER_ROLE_ID = 2;
    const BRANCH_MANAGER_ROLE_ID = 4;

    if (roleId === BRAND_MANAGER_ROLE_ID) {
        // Handle Brand Manager scenarios (fully or partially registered).
        const session = await prisma.onboardingSession.findFirst({
            where: { manager_id: user.id },
            orderBy: { createdAt: 'desc' },
        });

        if (session && session.status !== 'COMPLETED') {
            const responseData = { status: 'ONBOARDING_INCOMPLETE', onboardingStatus: session.status, user: userResponse, accessToken, refreshToken };
            return res.status(200).json(new ApiResponse(200, responseData, "Welcome back! Continuing your application."));
        }
        
        const responseData = { status: "LOGIN_SUCCESSFUL_PARTNER", user: userResponse, accessToken, refreshToken };
        return res.status(200).json(new ApiResponse(200, responseData, "Partner login successful."));

    } else if (roleId === BRANCH_MANAGER_ROLE_ID) {
        // A Branch Manager has a simpler login; we just send them to their dashboard.
        const responseData = { status: "LOGIN_SUCCESSFUL_BRANCH_PARTNER", user: userResponse, accessToken, refreshToken };
        return res.status(200).json(new ApiResponse(200, responseData, "Branch partner login successful."));
        
    } else {
        // Handle a non-partner user logging in (e.g., a customer).
        const responseData = { status: "LOGIN_SUCCESSFUL_CUSTOMER", user: userResponse, accessToken, refreshToken };
        return res.status(200).json(new ApiResponse(200, responseData, "Login successful."));
    }
});


export const verifyRegistrationOtpController = asyncHandler(async (req,res) => {
    const {phone_number,otpCode} = req.body;
    if (!phone_number || !otpCode) {
        throw new ApiError(400, "Phone number and OTP are required.");
    }

    const userOtpRecord = await prisma.userOTP.findFirst({
        where: { phone_number, status: "pending" },
        orderBy: { created_at: 'desc' }
    });

    if(!userOtpRecord || new Date() > userOtpRecord.expires_at || !(await comparePassword(otpCode,userOtpRecord.otp_code))){
        throw new ApiError(401,"Invalid or expired OTP");
    }

    await prisma.userOTP.update({where:{id: userOtpRecord.id},data:{status:"verified"}})

    // create registration token, this is a proof that the user has completed its verification
    const registrationToken = jwt.sign(
        {phone_number:userOtpRecord.phone_number},
        process.env.REGISTRATION_TOKEN_SECRET,
        {expiresIn: '1d'}
    );

    return res.status(200).json(new ApiResponse(200,{registrationToken},"Phone number is verified. Please complete your registration"));

})

export const registerUserController = asyncHandler(async (req,res) => {
    const {firstname,lastname,email,password,registrationToken,registrationType} = req.body;

    if(!firstname || !email || !password || !registrationToken || !registrationType ){
        throw new ApiError(400,'All fields and a registration token are required');
    }

    console.log("2.validation clear");
    
    let decodedToken;
    try {
        // verify the token
        decodedToken = jwt.verify(registrationToken,process.env.REGISTRATION_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401,"Invalid or expired registration token.");
    }

    // 3. Extract the verified phone number from the token's payload
    const {phone_number} = decodedToken;
    if(!phone_number) {
        throw new ApiError(401,"Registration token is invalid");
    }

    console.log("3.registration token verified passed");
    

    // 4. Final failsafe: Check if a user with this email or phone number was created.
    const existingUser = await prisma.user.findFirst({
        where:{
            OR: [{email}, {phone_number}]
        }
    });

    if(existingUser){
        throw new ApiError(400,"A user with this email or phone number already exists");
    }

    console.log("4.no existing user found passed");
    

    // hash the final password
    const hashedPassword = await hashPassword(password);

    // Define the role for new partners.
    // const BRAND_MANAGER_ROLE_ID = 2;
    const BRAND_MANAGER_ROLE_ID = 2;
    const BRANCH_MANAGER_ROLE_ID = 4;
    const CUSTOMER_ROLE_ID = 1;

    console.log("Starting database transaction");
    let primaryRoleId;

    const newUser = await prisma.$transaction(async (accountSetup) => {

        // function wrong(){
        //      await accountSetup.userRoles.upsert({
        //     where: { id: BRAND_MANAGER_ROLE_ID },
        //     update: {},
        //     create: { id: BRAND_MANAGER_ROLE_ID, role_name: role_name },
        // });

        // // Create the user.
        // const user = await accountSetup.user.create({
        //     data: {
        //         email,
        //         password: hashedPassword,
        //         firstname,
        //         lastname,
        //         phone_number,
        //         // The phone_verified_at is set here because this step can only be reached
        //         // after a successful OTP verification.
        //         phone_verified_at: new Date()
        //     }
        // });

        // // Assign the role.
        // await accountSetup.userHasRoles.create({
        //     data: {
        //         user_id: user.id,
        //         role_id: BRAND_MANAGER_ROLE_ID
        //     }
        // });
        // return user;
        // }
       

        console.log("Inside transaction started");
        
        const user = await accountSetup.user.create({
            data:{
                email,
                password:hashedPassword,
                firstname,
                lastname,
                phone_number,
                // The phone number is officially verified at this moment.
                phone_verifier_at: new Date()
            }
        });

        console.log(`user created with ID: `,user.id);

        const otpRecord = await accountSetup.userOTP.findFirst({
            where: {
                phone_number: phone_number,
                status: 'verified',
                user_id: null // Find the "orphaned" record
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        if (otpRecord) {
            await accountSetup.userOTP.update({
                where: { id: otpRecord.id },
                data: { user_id: user.id } // Link it to the new user
            });
        }
        
        console.log("OTp record updated with userIds passed" );
        

        if(registrationType.toLowerCase() === 'create_brand'){

            await accountSetup.userHasRoles.createMany({
                data: [
                    {user_id: user.id, role_id: BRAND_MANAGER_ROLE_ID},
                    {user_id: user.id, role_id: BRANCH_MANAGER_ROLE_ID} 
                ]
            });
            primaryRoleId = BRAND_MANAGER_ROLE_ID;
        }else if(registrationType.toLowerCase() === 'create_branch'){
            // A user joining a franchise is only a branch manager
            await accountSetup.userHasRoles.create({
                data: {user_id: user.id, role_id: BRANCH_MANAGER_ROLE_ID}
            });
            primaryRoleId=BRANCH_MANAGER_ROLE_ID;
        }else {
            // Default to creating a regular customer.
            await accountSetup.userHasRoles.create({
                data: {user_id: user.id, role_id: CUSTOMER_ROLE_ID} 
            })
                console.log("assigned customer role");
            primaryRoleId = CUSTOMER_ROLE_ID;
        }

        return user;
    });

    console.log("database trasaction completed");
    

    // final login tokens and response
    console.log("Database Trasaction Complete");
    

    const {accessToken,refreshToken} = await generateAndStoreTokens(newUser,req,primaryRoleId);
    console.log("recieved accesstoken and refreshtoken!");
    
    const {password:_,...userResponse} = newUser;
    console.log("login tokens generated");
    
    const responseData = {user : userResponse,  accessToken,refreshToken};

    console.log("sending final response");
    
    return res.status(200).json(new ApiResponse(201,responseData,"User registered successfully"));

})