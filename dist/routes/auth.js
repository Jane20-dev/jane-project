"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.authRoute = void 0;
const express_1 = require("express");
const user_service_1 = require("../services/user-service");
const jwt_1 = require("../utils/jwt");
const express_validator_1 = require("express-validator");
const auth_validation_1 = require("../validation/auth-validation");
exports.authRoute = (0, express_1.Router)();
// --- Middleware для аутентификации JWT токена ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ message: 'Need Bearer token' });
    }
    const token = authHeader && authHeader.split(' ')[1];
    //  Если токена нет, отправляем 401 Unauthorized
    if (!token) {
        return res.status(401).json({ message: 'Требуется аутентификация: токен не предоставлен.' });
    }
    try {
        const decodedPayload = (0, jwt_1.verifyAccessToken)(token);
        if (!decodedPayload) {
            return res.status(401).json({ message: 'Недействительный или просроченный токен.' });
        }
        req.user = decodedPayload;
        return next();
    }
    catch (error) {
        console.error(`[authenticateToken] Token verification failed:`, error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Токен просрочен' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Недействительный токен.' });
        }
        return res.status(500).json({ message: 'Ошибка аутентификации.' });
    }
};
exports.authenticateToken = authenticateToken;
exports.authRoute.post('/registration', auth_validation_1.registerValidation, async (req, res) => {
    const { login, email, password } = req.body;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const registrationUser = await user_service_1.userService.registerUser(login, email, password);
        if ('errorsMessages' in registrationUser) {
            return res.status(400).json({ errorsMessages: registrationUser.errorsMessages });
        }
        return res.status(204).send();
    }
    catch (error) {
        console.log('Error during registration', error);
        return res.status(500).json({ message: 'Error during registration' });
    }
});
exports.authRoute.post('/registration-confirmation', auth_validation_1.confirmationValidation, async (req, res) => {
    const { code } = req.body;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // const errorsMessages = []
    // if(!code || typeof code !== 'string' || code.trim().length === 0 ){
    //   errorsMessages.push({ message: 'Confirmation code is required', field: 'code' });
    // }
    // if (errorsMessages.length > 0){
    //   return res.status(400).send({errorsMessages});
    // }
    try {
        const isConfirmed = await user_service_1.userService.confirmEmail(code);
        if (isConfirmed) {
            return res.status(204).send();
        }
        else {
            return res.status(400).json({
                errorsMessages: [{ message: 'Confirmation code is incorrect, expired or already been applied', field: 'code' }]
            });
        }
    }
    catch (error) {
        console.log('Error during confirmation', error);
        return res.status(500).json({ message: 'Error during confirmation' });
    }
});
exports.authRoute.post('/registration-email-resending', auth_validation_1.resendingValidation, async (req, res) => {
    const { email } = req.body;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // const errorsMessages = []
    // if (!email || typeof email !== 'string' || email.trim().length === 0) {
    //   errorsMessages.push({ message: 'not valid email', field: 'email' });
    // }
    // if (errorsMessages.length > 0){
    //   return res.status(400).send({errorsMessages});
    // }
    try {
        const resendCodetoEmail = await user_service_1.userService.resendCode(email);
        if (resendCodetoEmail && 'errorsMessages' in resendCodetoEmail) {
            return res.status(400).json({ errorsMessages: resendCodetoEmail.errorsMessages });
        }
        console.log(`[Auth Route] /registration-email-resending successful for email: '${email}'.`);
        return res.status(204).send();
    }
    catch (error) {
        console.error(`[Auth Route] /registration-email-resending unexpected error for email '${email}':`, error);
        return res.status(500).json({ message: 'Internal server error during email resending.' });
    }
});
exports.authRoute.get('/me', exports.authenticateToken, async (req, res) => {
    if (!req.user) {
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
    res.status(200).json({
        userId: req.user.userId,
        email: req.user.email,
        login: req.user.userLogin
    });
    return true;
});
exports.authRoute.post('/login', auth_validation_1.loginValidation, async (req, res) => {
    const { loginOrEmail, password } = req.body;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = await user_service_1.userService.loginUser(loginOrEmail, password);
        if (!user) {
            return res.status(401).send('Unauthorized');
        }
        const tokenPayload = {
            userId: user.id,
            userLogin: user.login,
            email: user.email
        };
        const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload);
        await user_service_1.userService.saveRefreshToken(user.id, refreshToken);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            maxAge: 20 * 1000,
        });
        res.status(200).json({ accessToken: accessToken });
    }
    catch (error) {
        console.log(error, ' error');
        res.status(500).send('Error during login');
    }
    return true;
});
exports.authRoute.post('/refresh-token', async (req, res) => {
    const refreshTokenFromCookie = req.cookies.refreshToken;
    if (!refreshTokenFromCookie)
        return res.status(401).send('Unauthorized');
    try {
        const decodedPayload = (0, jwt_1.verifyAccessToken)(refreshTokenFromCookie);
        if (!decodedPayload || !decodedPayload.jti) {
            res.clearCookie('refreshToken');
            return res.status(401).send('Unauthorized');
        }
        const user = await user_service_1.userService.findRefreshTokeninDb(refreshTokenFromCookie);
        if (!user) {
            res.clearCookie('refreshToken');
            return res.status(401).send('Unauthorized');
        }
        const newAccessToken = (0, jwt_1.generateAccessToken)({
            userId: user.id,
            userLogin: user.login,
            email: user.email
        });
        const newRefreshToken = (0, jwt_1.generateRefreshToken)({
            userId: user.id,
            userLogin: user.login,
            email: user.email
        });
        await user_service_1.userService.saveRefreshToken(user.id, newRefreshToken);
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true,
            maxAge: 20 * 1000,
        });
        res.status(200).json({ accessToken: newAccessToken });
    }
    catch (error) {
        res.clearCookie('refreshToken');
        return res.status(401).send('Unauthorized');
    }
    return true;
});
exports.authRoute.post('/logout', async (req, res) => {
    const refreshTokenFromCookie = req.cookies.refreshToken;
    if (!refreshTokenFromCookie)
        return res.status(401).send('1. Unauthorized');
    try {
        const checkThisRefreshToken = (0, jwt_1.verifyAccessToken)(refreshTokenFromCookie);
        if (!checkThisRefreshToken || !checkThisRefreshToken.jti) {
            res.clearCookie('refreshToken');
            return res.status(401).send('2. Unauthorized');
        }
        const isLogout = await user_service_1.userService.revokeRefreshToken(refreshTokenFromCookie);
        if (!isLogout) {
            res.clearCookie('refreshToken');
            return res.status(401).send('3. Unauthorized');
        }
        res.clearCookie('refreshToken');
        res.status(204).send();
    }
    catch (error) {
        res.clearCookie('refreshToken');
        res.status(401).send('4. Unauthorized');
    }
    return true;
});
