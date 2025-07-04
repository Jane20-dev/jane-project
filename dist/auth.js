"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.authRoute = void 0;
const express_1 = require("express");
const user_service_1 = require("./services/user-service");
const jwt_1 = require("./utils/jwt");
const users_repository_1 = require("./repositories/users-repository");
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
exports.authRoute.post('/registration', async (req, res) => {
    const { login, email, password } = req.body;
    const errorsMessages = [];
    if (!login || login.trim().length === 0 || typeof login !== 'string' || login.length > 10 || login.length < 3) {
        errorsMessages.push({ message: 'Data of your login is wrong!', field: 'login' });
    }
    if (!password || password.trim().length === 0 || typeof password !== 'string' || password.length > 20 || password.length < 6) {
        errorsMessages.push({ message: 'Data of your password is wrong!', field: 'password' });
    }
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
        errorsMessages.push({ message: 'not valid email', field: 'email' });
    }
    if (errorsMessages.length > 0) {
        return res.status(400).send({ errorsMessages });
    }
    try {
        const userExistByLogin = await users_repository_1.usersRepository.findUserByLoginOrEmail(login);
        if (userExistByLogin) {
            errorsMessages.push({ message: 'login should be unique', field: 'login' });
        }
        const userExistByEmail = await users_repository_1.usersRepository.findUserByLoginOrEmail(email);
        if (userExistByEmail) {
            errorsMessages.push({ message: 'email should be unique', field: 'email' });
        }
        if (errorsMessages.length > 0) {
            return res.status(400).send({ errorsMessages });
        }
        const newUser = await user_service_1.userService.createUser(login, email, password);
        if (!newUser) {
            return res.status(500).send('Registration failed for some reason');
        }
        return res.status(204).send();
    }
    catch (error) {
        console.log('Error during registration', error);
        return res.status(500).send('Error during registration');
    }
});
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
