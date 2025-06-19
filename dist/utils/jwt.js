"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jWT_SECRET = process.env.JWT_SECRET || '1aB2cE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3z!@#$%^&*()';
;
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, jWT_SECRET, {
        expiresIn: '1h'
    });
};
exports.generateAccessToken = generateAccessToken;
const verifyAccessToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jWT_SECRET);
        return decoded;
    }
    catch (error) {
        console.error('Error with creating JWT token', error);
        return null;
    }
};
exports.verifyAccessToken = verifyAccessToken;
