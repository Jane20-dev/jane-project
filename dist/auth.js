"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoute = void 0;
const express_1 = require("express");
const user_service_1 = require("./services/user-service");
exports.authRoute = (0, express_1.Router)();
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
        const isAuthenticated = await user_service_1.userService.loginUser(loginOrEmail, password);
        if (!isAuthenticated) {
            return res.status(401).send('Unauthorized');
        }
        res.sendStatus(204);
    }
    catch (error) {
        console.log(error, ' error');
        res.status(500).send('Error during login');
    }
    return true;
});
