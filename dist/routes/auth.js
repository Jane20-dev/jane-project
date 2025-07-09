"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.authRoute = void 0;
const express_1 = require("express");
const user_service_1 = require("../services/user-service");
const jwt_1 = require("../utils/jwt");
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
        return next(); // Передаем управление дальше, только если все в порядке
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
exports.authRoute.post('/registration', async (req, res) => {
    const { login, email, password } = req.body;
    console.log(`[Auth Route] POST /registration request received. Raw body: ${JSON.stringify(req.body)}`);
    console.log(`[Auth Route] Parsed body: login='${login}', email='${email}'`);
    const errorsMessages = [];
    // Валидация login
    if (!login || login.trim().length === 0 || login.length < 3 || login.length > 10 || !/^[a-zA-Z0-9_-]*$/.test(login)) {
        errorsMessages.push({ message: 'not valid login', field: 'login' });
    }
    // Валидация email
    if (!email || email.trim().length === 0 || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        errorsMessages.push({ message: 'not valid email', field: 'email' });
    }
    // Валидация password
    if (!password || typeof password !== 'string' || password.trim().length === 0 || password.length < 6 || password.length > 20) {
        errorsMessages.push({ message: 'not valid password', field: 'password' });
    }
    if (errorsMessages.length > 0) {
        return res.status(400).send({ errorsMessages });
    }
    // if (!login || typeof login !== 'string' || login.trim().length === 0) {
    //     errorsMessages.push({ message: 'Login is required.', field: 'login' });
    // } else if (login.length < 3 || login.length > 10) {
    //     errorsMessages.push({ message: 'Login must be between 3 and 10 characters long.', field: 'login' });
    // } else if (!/^[a-zA-Z0-9_-]*$/.test(login)) {
    //     errorsMessages.push({ message: 'Login must contain only letters, numbers, hyphens, or underscores.', field: 'login' });
    // }
    // if (!password || typeof password !== 'string' || password.trim().length === 0) {
    //     errorsMessages.push({ message: 'Password is required.', field: 'password' });
    // } else if (password.length < 6 || password.length > 20) {
    //     errorsMessages.push({ message: 'Password must be between 6 and 20 characters long.', field: 'password' });
    // }
    // const emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    // if (!email || typeof email !== 'string' || email.trim().length === 0) {
    //     errorsMessages.push({ message: 'Email is required.', field: 'email' });
    // } else if (!emailPattern.test(email)) {
    //     errorsMessages.push({ message: 'Email must be a valid email address.', field: 'email' });
    // }
    // if (errorsMessages.length > 0){
    //   return res.status(400).send({errorsMessages});
    // }
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
exports.authRoute.post('/registration-confirmation', async (req, res) => {
    const { code } = req.body;
    const errorsMessages = [];
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
        errorsMessages.push({ message: 'Confirmation code is required', field: 'code' });
    }
    if (errorsMessages.length > 0) {
        return res.status(400).send({ errorsMessages });
    }
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
exports.authRoute.post('/registration-email-resending', async (req, res) => {
    const { email } = req.body;
    const errorsMessages = [];
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
        errorsMessages.push({ message: 'not valid email', field: 'email' });
    }
    if (errorsMessages.length > 0) {
        return res.status(400).send({ errorsMessages });
    }
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
        userLogin: req.user.userLogin
    });
    return true;
});
exports.authRoute.post('/login', async (req, res) => {
    const { loginOrEmail, password } = req.body;
    const errorsMessages = [];
    if (!loginOrEmail || loginOrEmail.trim().length === 0) {
        errorsMessages.push({ message: 'not valid login or email', field: 'loginOrEmail' });
    }
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
        errorsMessages.push({ message: 'not valid password', field: 'password' });
    }
    if (errorsMessages.length > 0) {
        return res.status(400).send({ errorsMessages });
    }
    try {
        const token = await user_service_1.userService.loginUser(loginOrEmail, password);
        if (!token) {
            return res.status(401).send('Unauthorized');
        }
        res.status(200).send({ accessToken: token });
    }
    catch (error) {
        console.log(error, ' error');
        res.status(500).send('Error during login');
    }
    return true;
});
