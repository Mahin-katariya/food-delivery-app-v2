import express from "express"
import dotenv from 'dotenv'
import prisma from "./db/prisma.js"
import { app } from "./app.js";

dotenv.config({
    path:'./.env'
});

const PORT = 8000;

async function serverStart(){
    try {
        await prisma.$connect();
        console.log("✅ Database connected successfully");
        app.listen(PORT,() => {
            console.log(`🚀 Server is running on port: ${PORT}`);
        })
    } catch (error) {
        console.error('❌ Database connection failed');
        console.error(error);
        process.exit(1);
    }
}

serverStart();