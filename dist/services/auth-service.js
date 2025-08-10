"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.AuthService = void 0;
// этот файл будет содержать бизнес-логику:
const users_repository_1 = require("../repositories/users-repository");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const device_repository_1 = require("../repositories/device-repository");
const uuid_1 = require("uuid");
const date_fns_1 = require("date-fns");
const jwt_1 = require("../utils/jwt");
const email_adapters_1 = require("../adapters/email-adapters");
const errors_1 = require("../errors");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthService {
    constructor(userRepo, deviceRepo) {
        this.userRepo = userRepo;
        this.deviceRepo = deviceRepo;
    }
    async registerUser(login, email, password) {
        const errorsMessages = [];
        const userByLogin = await this.userRepo.findUserByLogin(login);
        if (userByLogin) {
            return { errorsMessages: [{ message: 'Пользователь с таким login уже существует.', field: 'login' }] };
        }
        const userByEmail = await this.userRepo.findUserByEmail(email);
        if (userByEmail) {
            return { errorsMessages: [{ message: 'Пользователь с таким email уже существует.', field: 'email' }] };
        }
        if (errorsMessages.length > 0) {
            return { errorsMessages };
        }
        //хэширование пароля
        const saltRounds = 10;
        const passwordHash = await bcryptjs_1.default.hash(password, saltRounds);
        //код подтверждения и срок его действия
        const confirmationCode = (0, uuid_1.v4)();
        const expirationDate = (0, date_fns_1.add)(new Date(), { hours: 1 });
        const newUser = {
            id: (0, uuid_1.v4)(),
            login,
            email,
            passwordHash,
            createdAt: new Date().toISOString(),
            emailConfirmation: {
                confirmationCode: confirmationCode,
                expirationDate: expirationDate,
                isConfirmed: false,
            },
        };
        const createdUserResult = await this.userRepo.createUser(newUser);
        if (!createdUserResult) {
            return { errorsMessages: [{ field: 'general', message: 'Failed to create user' }] };
        }
        const FRONTEND_CONFIRM_URL = process.env.FRONTEND_CONFIRM_URL || 'https://somesite.com/confirm-email?code=your_confirmation_code';
        const confirmationLink = `${FRONTEND_CONFIRM_URL}?code=${confirmationCode}`;
        try {
            await email_adapters_1.emailAdapter.sendEmail(email, 'Подтверждение регистрации', `<h1>Спасибо за регистрацию!</h1>
                 <p>Чтобы завершить регистрацию, пожалуйста, перейдите по ссылке ниже:</p>
                 <a href='${confirmationLink}'>Завершить регистрацию</a>
                 <p>Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>`);
        }
        catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Если письмо не отправилось, считаем это ошибкой регистрации
            return { errorsMessages: [{ field: 'email', message: 'Failed to send confirmation email' }] };
        }
        return newUser;
    }
    async confirmEmail(confirmationCode) {
        const user = await this.userRepo.findUserByConfrimationCode(confirmationCode);
        console.log(`[UserService.confirmEmail] Attempting to confirm email with code: '${confirmationCode}'`);
        if (!user || user.emailConfirmation.isConfirmed || user.emailConfirmation.expirationDate < new Date()) {
            return false;
        }
        console.log(`[ConfirmEmail Service] Пользователь найден: ${user.login} (${user.email})`);
        console.log(`[ConfirmEmail Service] Код в БД: ${user.emailConfirmation.confirmationCode}`);
        console.log(`[ConfirmEmail Service] Срок действия кода (в БД): ${user.emailConfirmation.expirationDate ? user.emailConfirmation.expirationDate.toISOString() : 'N/A'}`);
        console.log(`[ConfirmEmail Service] Текущее время (сейчас): ${new Date().toISOString()}`);
        const updated = await this.userRepo.updateEmailStatus(user.id, true);
        return updated;
    }
    async loginUser(loginOrEmail, password, ip, userAgent) {
        const user = await this.userRepo.findUserByLoginOrEmail(loginOrEmail);
        if (!user)
            return null;
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch)
            return null;
        const deviceId = (0, uuid_1.v4)();
        const now = new Date(); // это будет текущее время создания сессии!
        const REFRESH_TOKEN_EXPIRES_IN_SECONDS = 20 * 60;
        const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000);
        const tokenPayload = {
            userId: user.id,
            userLogin: user.login,
            email: user.email,
            deviceId: deviceId,
        };
        const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload, REFRESH_TOKEN_EXPIRES_IN_SECONDS);
        const decodedRefreshTokenPayload = jsonwebtoken_1.default.decode(refreshToken);
        if (!decodedRefreshTokenPayload || !decodedRefreshTokenPayload.jti) {
            return null;
        }
        const jtiForDb = decodedRefreshTokenPayload.jti;
        const deviceName = userAgent || 'Unknown device';
        const sessionData = {
            userId: user.id,
            deviceId: deviceId,
            ip: ip,
            deviceName: deviceName,
            issuedAt: now,
            expiresAt: expiresAt,
            lastActiveDate: now,
            jti: jtiForDb,
        };
        const sessionCreated = await this.deviceRepo.createDeviceSession(sessionData);
        if (!sessionCreated)
            return null;
        return {
            accessToken,
            refreshToken,
            userId: user.id,
            userLogin: user.login,
            email: user.email,
            deviceId: deviceId,
            jti: jtiForDb,
        };
    }
    async logoutUser(refreshTokenFromCookie) {
        const decodedPayload = (0, jwt_1.verifyRefreshToken)(refreshTokenFromCookie);
        if (!decodedPayload || !decodedPayload.jti || !decodedPayload.userId) {
            return false;
        }
        const session = await this.deviceRepo.findDeviceSessionInDB(decodedPayload.deviceId, decodedPayload.userId, decodedPayload.jti);
        if (!session) {
            return false;
        }
        const isDeleted = await this.deviceRepo.deleteThisOldSession(decodedPayload.jti);
        if (!isDeleted) {
            console.error('AuthService.logoutUser: Не удалось удалить сессию из БД по JTI.');
            return false;
        }
        return true;
    }
    async refreshTokensSession(oldRefreshToken, currentIp, currentUserAgent) {
        const oldDecodedPayload = (0, jwt_1.verifyRefreshToken)(oldRefreshToken);
        if (!oldDecodedPayload || !oldDecodedPayload.deviceId || !oldDecodedPayload.userId || !oldDecodedPayload.jti) {
            console.warn('[AuthService] refreshTokensSession: Payload из старого Refresh Token недействителен или неполный.');
            return null;
        }
        console.log('Payload из токена: userId=', oldDecodedPayload.userId, 'deviceId=', oldDecodedPayload.deviceId, 'jti=', oldDecodedPayload.jti);
        const oldSession = await this.deviceRepo.findDeviceSessionInDB(oldDecodedPayload.deviceId, oldDecodedPayload.userId, oldDecodedPayload.jti);
        console.log('Сессия найдена в БД:', oldSession ? 'Да' : 'Нет');
        if (!oldSession)
            return null;
        if (oldSession.expiresAt < new Date()) {
            await this.deviceRepo.deleteThisOldSession(oldDecodedPayload.jti);
            return null;
        }
        const isOldSessionDeleted = await this.deviceRepo.deleteThisOldSession(oldSession.jti);
        if (!isOldSessionDeleted) {
            console.error('[AuthService] refreshTokensSession: Не удалось удалить старую сессию из БД.');
            return null;
        }
        const user = await this.userRepo.findUserById(oldDecodedPayload.userId);
        if (!user) {
            return null;
        }
        const newDeviceId = oldDecodedPayload.deviceId; // Генерируем новый deviceId для нового Refresh Token
        const now = new Date();
        const REFRESH_TOKEN_EXPIRES_IN_SECONDS = 20 * 60; // Срок жизни Refresh Token
        const expiresAt = (0, date_fns_1.add)(now, { seconds: REFRESH_TOKEN_EXPIRES_IN_SECONDS });
        const newTokenPayload = {
            userId: user.id,
            userLogin: user.login,
            email: user.email,
            deviceId: newDeviceId, // Новый deviceId в новом Refresh Token
        };
        const accessToken = (0, jwt_1.generateAccessToken)(newTokenPayload);
        const newRefreshJwt = (0, jwt_1.generateRefreshToken)(newTokenPayload, REFRESH_TOKEN_EXPIRES_IN_SECONDS);
        const decodedRefreshTokenPayload = jsonwebtoken_1.default.decode(newRefreshJwt);
        if (!decodedRefreshTokenPayload || !decodedRefreshTokenPayload.jti) {
            return null;
        }
        const jtiForDb = decodedRefreshTokenPayload.jti;
        //  Создаем новую сессию в БД с новым deviceId
        const deviceName = currentUserAgent || oldSession.deviceName || "Unknown device"; // Используем текущий user-agent или старый
        const sessionCreated = await this.deviceRepo.createDeviceSession({
            userId: user.id,
            deviceId: newDeviceId,
            ip: currentIp,
            deviceName: deviceName,
            jti: jtiForDb,
            issuedAt: now,
            expiresAt: expiresAt,
            lastActiveDate: now
        });
        if (!sessionCreated) {
            console.error('AuthService: Failed to create new device session during token refresh for user:', user.id);
            return null;
        }
        return {
            accessToken,
            refreshToken: newRefreshJwt,
            userId: user.id,
            userLogin: user.login,
            jti: jtiForDb,
            email: user.email,
            deviceId: newDeviceId,
        };
    }
    async getUserActiveSessions(userId) {
        // Предполагаем, что findUserDeviceSessions уже реализован в deviceRepository
        // и возвращает массив DeviceSessionDbType
        const sessions = await this.deviceRepo.findUserDeviceSessions(userId);
        // Преобразуем формат в требуемый по OpenAPI спецификации
        return sessions.map(session => ({
            ip: session.ip,
            title: session.deviceName,
            lastActiveDate: session.issuedAt.toISOString(), // 'issuedAt' из БД соответствует 'lastActiveDate'
            deviceId: session.deviceId
        }));
    }
    // async deleteSpecificUserDeviceSession(userId: string, currentDeviceId: string): Promise<boolean>{
    //     const session = await this.deviceRepo.findDeviceSessionInDB(currentDeviceId, userId);
    //     if(!session){
    //         return false;
    //     }
    //     return await this.deviceRepo.deleteThisOldSession(currentJti);
    // }
    async deletedDevicebyId(userId, deviceIdToDelete) {
        const deviceSession = await this.deviceRepo.getDevicesessionById(deviceIdToDelete);
        if (!deviceSession) {
            throw new errors_1.DeviceNotfoundError('Device session with ID ${deviceIdToDelete} not found.');
        }
        if (deviceSession.userId !== userId) {
            throw new errors_1.DeviceNotOwnedError('Device session belongs to another user.');
        }
        const isDeleted = await device_repository_1.deviceRepository.deleteBelongSession(deviceIdToDelete);
        return isDeleted;
    }
    async deleteAllSesions(userId, currentDeviceId) {
        return await this.deviceRepo.deleteAllSessions(userId, currentDeviceId);
    }
    async resendCode(email) {
        const user = await this.userRepo.findUserByEmail(email);
        if (!user) {
            return { errorsMessages: [{ message: 'User with this email does not exist.', field: 'email' }] };
        }
        if (user.emailConfirmation.isConfirmed) {
            console.warn(`[UserService.resendConfirmationEmail] Email '${email}' is already confirmed. Cannot resend.`);
            return { errorsMessages: [{ message: 'Email is already confirmed.', field: 'email' }] };
        }
        const newCode = (0, uuid_1.v4)();
        const newExpirationData = (0, date_fns_1.add)(new Date(), { hours: 1 });
        const updateInDb = await this.userRepo.updateConfirmationCode(user.id, newCode, newExpirationData);
        if (!updateInDb) {
            return { errorsMessages: [{ message: 'Failed to update confirmation data.', field: 'email' }] };
        }
        const FRONTEND_CONFIRM_URL = process.env.FRONTEND_CONFIRM_URL;
        const confirmationLink = `${FRONTEND_CONFIRM_URL}?code=${newCode}`;
        try {
            await email_adapters_1.emailAdapter.sendEmail(email, 'Переотправка кода подтверждения', `<h1>Переотправка кода подтверждения</h1>
                 <p>Вы запросили новый код подтверждения. Пожалуйста, перейдите по ссылке ниже:</p>
                 <a href='${confirmationLink}'>Подтвердить email</a>
                 <p>Если вы не запрашивали это, просто проигнорируйте это письмо.</p>`);
            return;
        }
        catch (emailError) {
            console.error('Error sending resend email:', emailError);
            return { errorsMessages: [{ message: 'Failed to send confirmation email.', field: 'email' }] };
        }
    }
    async saveRefreshToken(userId, refreshToken) {
        const isUpdated = await this.userRepo.updatedRefreshToken(userId, refreshToken);
        return isUpdated;
    }
    async findRefreshTokeninDb(refreshToken) {
        const isFound = await this.userRepo.findRefreshTokenInDb(refreshToken);
        return isFound;
    }
    async revokeRefreshToken(refreshToken) {
        const user = await this.userRepo.findUserByRefreshToken(refreshToken);
        if (!user)
            return false;
        const isLogout = await this.userRepo.updatedRefreshToken(user.id, null);
        return isLogout;
    }
}
exports.AuthService = AuthService;
;
exports.userService = new AuthService(users_repository_1.usersRepository, device_repository_1.deviceRepository);
