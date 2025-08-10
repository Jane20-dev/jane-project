import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET: string = process.env.JWT_SECRET || '1aB2cE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3z!@#$%^&*()';


declare global {
    namespace Express {
        interface Request{
            userPayload: TokenPayload | null
        }
    }
}
export interface TokenPayload {
    userLogin: string;
    userId: string;
    email: string;
    deviceId: string;
    jti?: string;   

    iat?: number;
    exp?: number
    
};

export const generateAccessToken = (payload:  TokenPayload): string => {
    const {jti, iat, exp, ...payloadWithoutExpandIat} = payload as any
    return jwt.sign(payloadWithoutExpandIat, JWT_SECRET,
        {
            expiresIn: '10m'
        }
    )
};

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '1aB2cE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3z!@#$%^&*()' ;
export const generateRefreshToken = (payload: TokenPayload, expiresInSeconds: number): string => {
   const { iat, exp, ...payloadWithoutExpAndIat } = payload as any;
    const jti = uuidv4();

    const refreshTokenPayload: TokenPayload = { ...payloadWithoutExpAndIat, jti: jti};

    return jwt.sign(
        refreshTokenPayload, 
        JWT_REFRESH_SECRET,          
        {
            expiresIn: `${expiresInSeconds}s`
        }
    );
};





export const verifyAccessToken = (token: string): TokenPayload | null => {
    try {
        return  jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        console.error('Error with creating JWT token',error)
        return null
    }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET as string) as TokenPayload;
    } catch (error) {
        console.error('Error with creating JWT token',error)
        return null
    }
};

