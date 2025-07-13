
import { body } from 'express-validator'; 


export const loginValidation = [
    
    body('loginOrEmail')
        .trim() 
        .notEmpty() 
        .withMessage('Login or email cannot be empty.'), 

   
    body('password')
        .isString() 
        .trim() 
        .notEmpty() 
        .withMessage('Password cannot be empty.') 
];

export const registerValidation = [
    body('login')
    .isString().withMessage('login must be a string.')
    .trim()
    .notEmpty().withMessage('Login cannot be empty.')
    .isLength({ min: 3, max: 10 }).withMessage('Login must be between 3 and 10 characters long.')
    .matches(/^[a-zA-Z0-9_-]*$/).withMessage('Login must contain only letters, numbers, hyphens, or underscores.'),

    body('password')
    .trim()
    .isString().withMessage('login must be a string.')
    .notEmpty().withMessage('password cannot be empty')
    .isLength({min: 6, max: 20}).withMessage('password length is wrong'),
    

    body('email')
    .isString().withMessage('email must be a string.')
    .trim()
    .notEmpty().withMessage('email cannot be empty.')
    .withMessage('login cannot be empty.')
    .matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/).withMessage('email must contain only letters, numbers, hyphens, or underscores.')

];

export const confirmationValidation = [
    body('code')
    .trim()
    .isString().withMessage('code must be a string.')
    .notEmpty().withMessage('code cannot be empty')
];

export const resendingValidation = [
    body('email')
    .isString().withMessage('email must be a string.')
    .trim()
    .notEmpty().withMessage('email cannot be empty.')
    .withMessage('login cannot be empty.')
    .matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/).withMessage('email must contain only letters, numbers, hyphens, or underscores.')


];