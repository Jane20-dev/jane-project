import jwt from 'jsonwebtoken';

const jWT_SECRET: string = process.env.JWT_SECRET || '1aB2cE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3z!@#$%^&*()';

export interface TokenPayload {
    userLogin: string;
    userId: string;
    email: string;
    // login: string;
};

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, jWT_SECRET,
        {
            expiresIn: '1h'
        }
    )
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
    try {
        const decoded = jwt.verify(token, jWT_SECRET) as TokenPayload;
        return decoded
    } catch (error) {
        console.error('Error with creating JWT token',error)
        return null
    }
}