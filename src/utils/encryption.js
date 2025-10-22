import crypto from 'crypto'
import { ApiError } from './ApiError.js'

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

const ENCRYPTION_KEY  = process.env.ENCRYPTION_SECRET_KEY;

if(!ENCRYPTION_KEY || ENCRYPTION_KEY.length != 64){
    throw new ApiError(500,"ENCRYPTION_SECRET_KEY is not set or is not a 64-character hex string in the .env file");
}

const keyBuffer = Buffer.from(ENCRYPTION_KEY,'hex');

// generate a random initialization vector (IV) for each ecryption, which is a security best practice.
// iv joined with the encrypted data with the colon 'iv:encrypted_data'

export function encrypt(text){
    // generate a new, random iv for each encryption
    const iv = crypto.randomBytes(IV_LENGTH);
    // Create a new cipher instance
    const cipher = crypto.createCipheriv(ALGORITHM,keyBuffer,iv);
    // Encrypt text
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted,cipher.final()]);
    // return the iv and the encrypted data as a single hex string, separated by colon.
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}


export function decrypt(text){
    // Split the string into the IV and the encrypted data.
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    // Create a new decipher instance.
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    // Decrypt the text.
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    // Return the original plain text.
    return decrypted.toString();
}


