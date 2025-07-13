"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendingValidation = exports.confirmationValidation = exports.registerValidation = exports.loginValidation = void 0;
const express_validator_1 = require("express-validator");
exports.loginValidation = [
    (0, express_validator_1.body)('loginOrEmail')
        .trim()
        .notEmpty()
        .withMessage('Login or email cannot be empty.'),
    (0, express_validator_1.body)('password')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Password cannot be empty.')
];
exports.registerValidation = [
    (0, express_validator_1.body)('login')
        .isString().withMessage('login must be a string.')
        .trim()
        .notEmpty().withMessage('Login cannot be empty.')
        .isLength({ min: 3, max: 10 }).withMessage('Login must be between 3 and 10 characters long.')
        .matches(/^[a-zA-Z0-9_-]*$/).withMessage('Login must contain only letters, numbers, hyphens, or underscores.'),
    (0, express_validator_1.body)('password')
        .trim()
        .isString().withMessage('login must be a string.')
        .notEmpty().withMessage('password cannot be empty')
        .isLength({ min: 6, max: 20 }).withMessage('password length is wrong'),
    (0, express_validator_1.body)('email')
        .isString().withMessage('email must be a string.')
        .trim()
        .notEmpty().withMessage('email cannot be empty.')
        .withMessage('login cannot be empty.')
        .matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/).withMessage('email must contain only letters, numbers, hyphens, or underscores.')
];
exports.confirmationValidation = [
    (0, express_validator_1.body)('code')
        .trim()
        .isString().withMessage('code must be a string.')
        .notEmpty().withMessage('code cannot be empty')
];
exports.resendingValidation = [
    (0, express_validator_1.body)('email')
        .isString().withMessage('email must be a string.')
        .trim()
        .notEmpty().withMessage('email cannot be empty.')
        .withMessage('login cannot be empty.')
        .matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/).withMessage('email must contain only letters, numbers, hyphens, or underscores.')
];
