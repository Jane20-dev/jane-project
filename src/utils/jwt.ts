import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const jWT_SECRET: string = process.env.JWT_SECRET || '1aB2cE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3z!@#$%^&*()';

export interface TokenPayload {
    userLogin: string;
    userId: string;
    email: string;
    jti?: string; 
    
};

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, jWT_SECRET,
        {
            expiresIn: '10s'
        }
    )
};


export const generateRefreshToken = (payload: TokenPayload): string => {
    const jti = uuidv4();

    const refreshTokenPayload: TokenPayload = { ...payload, jti: jti };

    return jwt.sign(
        refreshTokenPayload, 
        jWT_SECRET,          
        {
            expiresIn: '20s'
        }
    );
};





export const verifyAccessToken = (token: string): TokenPayload | null => {
    try {
        return  jwt.verify(token, jWT_SECRET) as TokenPayload;
    } catch (error) {
        console.error('Error with creating JWT token',error)
        return null
    }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, jWT_SECRET) as TokenPayload;
    } catch (error) {
        console.error('Error with creating JWT token',error)
        return null
    }
};

