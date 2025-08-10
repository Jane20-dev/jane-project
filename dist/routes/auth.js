"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.authRoute = void 0;
const express_1 = require("express");
const auth_service_1 = require("../services/auth-service");
const jwt_1 = require("../utils/jwt");
const express_validator_1 = require("express-validator");
const auth_validation_1 = require("../validation/auth-validation");
const users_repository_1 = require("../repositories/users-repository");
const device_repository_1 = require("../repositories/device-repository");
const rate_limiter_1 = require("../middleware/rate-limiter");
exports.authRoute = (0, express_1.Router)();
// --- Middleware для аутентификации JWT токена ---
const authenticateToken = async (req, res, next) => {
    console.log('\n--- НАЧАЛО authenticateToken ---');
    console.log('Метод запроса:', req.method);
    console.log('Путь запроса:', req.originalUrl);
    console.log('Все заголовки запроса:', req.headers);
    console.log('Query параметры:', req.query);
    let token = null;
    let isRefreshToken = false;
    const authHeader = req.headers.authorization;
    //авторизация
    if (authHeader && authHeader.startsWith('Bearer')) {
        token = authHeader.split(' ')[1];
        console.log('Диагностика: Токен найден в заголовке Authorization.');
    }
    if (req.cookies && req.cookies.refreshToken) {
        token = req.cookies.refreshToken;
        isRefreshToken = true;
    }
    //  Если токена нет, отправляем 401 Unauthorized
    if (!token) {
        return res.status(401).json({ message: 'Need Bearer token' });
    }
    try {
        let decodedPayload = null;
        if (!isRefreshToken) {
            decodedPayload = (0, jwt_1.verifyRefreshToken)(token);
            // return res.status(401).json({ message: 'Недействительный или просроченный токен.' });
        }
        else {
            decodedPayload = (0, jwt_1.verifyAccessToken)(token);
        }
        // const user = await usersRepository.findUserById(decodedPayload.userId);
        if (!(decodedPayload === null || decodedPayload === void 0 ? void 0 : decodedPayload.userId) || !(decodedPayload === null || decodedPayload === void 0 ? void 0 : decodedPayload.deviceId) || !decodedPayload.jti) {
            return res.status(401).json({ message: 'Недействительный токеен: Пользователь не найден!' });
        }
        const user = await users_repository_1.usersRepository.findUserById(decodedPayload.userId);
        if (!user) {
            return res.status(401).json({ message: 'Недействительный токен: Пользователь не найден!' });
        }
        const devicesession = await device_repository_1.deviceRepository.findDeviceSessionInDB(decodedPayload.deviceId, decodedPayload.userId, decodedPayload.jti);
        if (!devicesession || devicesession.expiresAt < new Date()) {
            return res.status(401).send({ message: 'Cannot find device in bd' });
        }
        console.log(`[authenticateToken] Токен декодирован: userId=${decodedPayload.userId}, deviceId=${decodedPayload.deviceId}`);
        req.userPayload = decodedPayload;
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
exports.authRoute.post('/registration', (0, rate_limiter_1.ipLimiterForRegistr)(5, 10), auth_validation_1.registerValidation, async (req, res) => {
    const { login, email, password } = req.body;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const registrationUser = auth_service_1.userService.registerUser(login, email, password);
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
exports.authRoute.post('/registration-confirmation', (0, rate_limiter_1.ipLimiterForConfirmation)(5, 10), auth_validation_1.confirmationValidation, async (req, res) => {
    const { code } = req.body;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const isConfirmed = await auth_service_1.userService.confirmEmail(code);
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
exports.authRoute.post('/registration-email-resending', (0, rate_limiter_1.ipLimiterForEmailResending)(5, 10), auth_validation_1.resendingValidation, async (req, res) => {
    const { email } = req.body;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const resendCodetoEmail = auth_service_1.userService.resendCode(email);
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
exports.authRoute.post('/login', (0, rate_limiter_1.ipLimiterForLogin)(5, 10), auth_validation_1.loginValidation, async (req, res) => {
    const { loginOrEmail, password } = req.body;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const ip = req.ip || 'unknown';
        const userAgent = req.headers['user-agent'];
        const user = await auth_service_1.userService.loginUser(loginOrEmail, password, ip, userAgent);
        if (!user) {
            return res.status(401).send('Unauthorized');
        }
        res.cookie('refreshToken', user.refreshToken, {
            httpOnly: true,
            secure: true,
            maxAge: 20 * 1000,
        });
        res.status(200).json({ accessToken: user.accessToken });
    }
    catch (error) {
        console.log(error, ' error');
        res.status(500).send('Error during login');
    }
    return true;
});
const REFRESH_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;
exports.authRoute.post('/refresh-token', async (req, res) => {
    const refreshTokenFromCookie = req.cookies.refreshToken;
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    // 1. Проверка наличия Refresh Token в куках
    if (!refreshTokenFromCookie) {
        return res.status(401).send('1.Unauthorized');
    }
    try {
        const oldDecodedPayload = await auth_service_1.userService.refreshTokensSession(refreshTokenFromCookie, ip, userAgent);
        // Если токен недействителен или не содержит нужных данных
        if (!oldDecodedPayload) {
            res.clearCookie('refreshToken');
            return res.status(401).send('2.Invalid or expired refresh token.');
        }
        res.cookie('refreshToken', oldDecodedPayload.refreshToken, {
            httpOnly: true,
            secure: true,
            maxAge: REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000
        });
        return res.status(200).json({ accessToken: oldDecodedPayload.accessToken });
    }
    catch (error) {
        res.clearCookie('refreshToken');
        return res.status(401).send('3. in the end cannot refresh token');
    }
    // 3. Поиск сессии устройства в базе данных
    //     const deviceSessionInDB = await deviceRepository.findDeviceSessionInDB(
    //         oldDecodedPayload.deviceId,
    //         oldDecodedPayload.userId,
    //     );
    //     // 4. Проверка существования сессии и ее срока действия в БД
    //     if (!deviceSessionInDB || deviceSessionInDB.expiresAt < new Date()) {
    //         console.warn('POST /refresh-token: Сессия устройства не найдена в БД или просрочена в БД.');
    //         // Если сессия найдена, но просрочена, удаляем ее
    //         if (deviceSessionInDB) {
    //             await deviceRepository.deleteThisOldSession(oldDecodedPayload.deviceId);
    //         }
    //         res.clearCookie('refreshToken');
    //         return res.status(401).send('Device session not found or invalidated.');
    //     }
    //     // 5. УДАЛЯЕМ СТАРУЮ СЕССИЮ ИЗ БАЗЫ ДАННЫХ (модель "сжигания" токена)
    //     const isOldSessionDeleted = await deviceRepository.deleteThisOldSession(oldDecodedPayload.deviceId);
    //     // Если по какой-то причине не удалось удалить старую сессию
    //     if (!isOldSessionDeleted) {
    //         console.error('POST /refresh-token: НЕ УДАЛОСЬ удалить старую сессию устройства из БД. Возврат 500.');
    //         res.clearCookie('refreshToken');
    //         return res.status(500).send('Internal Server Error: Failed to invalidate old session.');
    //     }
    //     // 6. Генерируем НОВЫЕ токены (Access и Refresh)
    //     const newAccessToken = generateAccessToken(oldDecodedPayload);
    //     const newRefreshToken = generateRefreshToken(oldDecodedPayload, REFRESH_TOKEN_EXPIRES_IN_SECONDS);
    //     // 7. Декодируем новый Refresh Token для получения iat и exp для новой сессии
    //     // Используем старый payload, но генерируем новый JTI в generateRefreshToken
    //     const newRefreshTokenPayload = jwt.decode(newRefreshToken) as TokenPayload;
    //     if(!newRefreshTokenPayload){
    //       return res.status(500).send('Failed to generate new refresh token with JTI.')
    //     }
    //     const newIssuedDate = new Date(newRefreshTokenPayload.iat! * 1000);
    //     const newExpiresDate = new Date(newRefreshTokenPayload.exp! * 1000);
    //     // 8. Создаем НОВУЮ запись сессии в БД для нового Refresh Token
    //     const isNewSessionCreated = await deviceRepository.createDeviceSession({
    //       userId: oldDecodedPayload.userId,
    //       deviceId: oldDecodedPayload.deviceId, // Используем ТОТ ЖЕ Device ID
    //       ip: ip,
    //       deviceName: userAgent,
    //       issuedAt: newIssuedDate,
    //       lastActiveDate: newIssuedDate,
    //       expiresAt: newExpiresDate,
    //       // jti: newRefreshTokenPayload.jti,
    //     });
    //     if (!isNewSessionCreated) {
    //         console.error('POST /refresh-token: Не удалось создать новую сессию после refresh. Возврат 500.');
    //         res.clearCookie('refreshToken');
    //         return res.status(500).send('Failed to create new session after refresh.');
    //     }
    //     // 9. Отправляем новый Refresh Token в куках и Access Token в теле ответа
    //     res.cookie('refreshToken', newRefreshToken, {
    //         httpOnly: true,
    //         secure: true,
    //         maxAge: REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000, // maxAge в миллисекундах
    //     });
    //     return res.status(200).json({ accessToken: newAccessToken });
    // } catch (error) {
    //     // Ловим любые ошибки, которые могли произойти
    //     console.error('POST /refresh-token: Ошибка в процессе обновления токенов:', error);
    //     res.clearCookie('refreshToken'); // Всегда очищаем куку при любой ошибке
    //     return res.status(500).send('Internal Server Error.');
    // }
});
exports.authRoute.post('/logout', async (req, res) => {
    const refreshTokenFromCookie = req.cookies.refreshToken;
    if (!refreshTokenFromCookie)
        return res.status(401).send('1. Unauthorized');
    try {
        const isLogout = await auth_service_1.userService.logoutUser(refreshTokenFromCookie);
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
