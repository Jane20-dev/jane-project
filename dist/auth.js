"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoute = void 0;
const express_1 = require("express");
const user_service_1 = require("./services/user-service");
const jwt_1 = require("./utils/jwt");
exports.authRoute = (0, express_1.Router)();
// --- Middleware для аутентификации JWT токена ---
// Этот middleware будет проверять токен перед тем, как запрос дойдет до конечного обработчика маршрута.
const authenticateToken = (req, res, next) => {
    // 1. Извлекаем заголовок 'Authorization'
    const authHeader = req.headers['authorization'];
    // Ожидаем формат: "Bearer <YOUR_TOKEN>"
    const token = authHeader && authHeader.split(' ')[1];
    // 2. Если токена нет, отправляем 401 Unauthorized
    if (token == null) {
        return res.status(401).json({ message: 'Требуется аутентификация: токен не предоставлен.' });
    }
    // 3. Верифицируем токен с помощью вашей утилиты
    const decodedPayload = (0, jwt_1.verifyAccessToken)(token);
    // 4. Если токен недействителен (просрочен, подделан и т.д.), отправляем 403 Forbidden
    if (!decodedPayload) {
        return res.status(403).json({ message: 'Недействительный или просроченный токен.' });
    }
    // 5. Если токен действителен, прикрепляем декодированную полезную нагрузку к объекту req
    // Теперь информация о пользователе (userId, email, login) будет доступна в req.user
    req.user = decodedPayload;
    // 6. Передаем управление следующему middleware или обработчику маршрута
    next();
};
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
        res.status(200).json({ token: token });
    }
    catch (error) {
        console.log(error, ' error');
        res.status(500).send('Error during login');
    }
    return true;
});
exports.authRoute.get('/me', authenticateToken, async (req, res) => {
    if (!req.user) {
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
    res.status(200).json({
        userId: req.user.userId,
        login: req.user.login,
        email: req.user.email
    });
});
