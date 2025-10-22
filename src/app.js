import express from 'express'
import cookieParser from 'cookie-parser';
import cors from 'cors'
import { ApiError } from './utils/ApiError.js';

const app = express();

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:'16kb'}));
app.use(express.static("public"));
app.use(cors({
    origin:process.env.CORS_ORIGIN
}));
app.use(cookieParser());

// Import routers
// import userRouter from './routes/user.routes.js';
// import brandRouter from './routes/brand.routes.js'
// import onboardingRouter from './routes/onboarding.routes.js'
import authRouter from './routes/auth.routes.js'
import userRouter from './routes/user.routes.js'
import onboardingRouter from './routes/onboarding.routes.js'

app.use("/api/v2/auth",authRouter);
app.use("/api/v2/onboarding",onboardingRouter);
app.use("/api/v2/users",userRouter);
// app.use("/api/v1/users",userRouter);
// app.use("/api/v1/users",onboardingRouter);
// app.use("/api/v1/brands",brandRouter);


export {app};


app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        // Call the new method to get the clean JSON object.
        return res.status(err.statusCode).json(err.toJSON());
    }
    // ... handle other unexpected errors
});