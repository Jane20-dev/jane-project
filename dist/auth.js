"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.authRoute = void 0;
const express_1 = require("express");
const user_service_1 = require("./services/user-service");
const jwt_1 = require("./utils/jwt");
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
        return res.status(403).json({ message: 'Токен просрочен' });
    }
};
exports.authenticateToken = authenticateToken;
exports.authRoute.post('/login', async (req, res) => {
    const { loginOrEmail, password } = req.body;
    const errorsMessages = [];
    // Валидация входных данных
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
