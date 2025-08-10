"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const JWT_SECRET = process.env.JWT_SECRET || '1aB2cE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3z!@#$%^&*()';
;
const generateAccessToken = (payload) => {
    const { jti, iat, exp, ...payloadWithoutExpandIat } = payload;
    return jsonwebtoken_1.default.sign(payloadWithoutExpandIat, JWT_SECRET, {
        expiresIn: '10m'
    });
};
exports.generateAccessToken = generateAccessToken;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '1aB2cE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3z!@#$%^&*()';
const generateRefreshToken = (payload, expiresInSeconds) => {
    const { iat, exp, ...payloadWithoutExpAndIat } = payload;
    const jti = (0, uuid_1.v4)();
    const refreshTokenPayload = { ...payloadWithoutExpAndIat, jti: jti };
    return jsonwebtoken_1.default.sign(refreshTokenPayload, JWT_REFRESH_SECRET, {
        expiresIn: `${expiresInSeconds}s`
    });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        console.error('Error with creating JWT token', error);
        return null;
    }
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
    }
    catch (error) {
        console.error('Error with creating JWT token', error);
        return null;
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
