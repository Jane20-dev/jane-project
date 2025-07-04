"use strict";
// 1. Создание user-service.ts
// Этот файл будет содержать бизнес-логику:
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
// Хэширование пароля с использованием bcrypt.
// Проверка уникальности login и email.
// Логика авторизации с проверкой пароля через bcrypt.
const users_repository_1 = require("../repositories/users-repository");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const date_fns_1 = require("date-fns");
const jwt_1 = require("../utils/jwt");
const email_adapters_1 = require("../adapters/email-adapters");
exports.userService = {
    async registerUser(login, email, password) {
        // Проверка уникальности login и email с помощью методов репозитория
        //Если найдется дубликат, вернется ошибка
        const errorsMessages = [];
        const userByLogin = await users_repository_1.usersRepository.findUserByLogin(login);
        if (userByLogin) {
            errorsMessages.push({ field: 'login', message: 'login should be unique' });
        }
        const userByEmail = await users_repository_1.usersRepository.findUserByEmail(email);
        if (userByEmail) {
            errorsMessages.push({ field: 'email', message: 'email should be unique' });
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
        const createdUserResult = await users_repository_1.usersRepository.createUser(newUser);
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
    },
    async loginUser(loginOrEmail, password) {
        const user = await users_repository_1.usersRepository.findUserByLoginOrEmail(loginOrEmail);
        if (!user) {
            return null;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return null;
        }
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            userLogin: user.login
        };
        const token = (0, jwt_1.generateAccessToken)(tokenPayload);
        return token;
    },
    async confirmEmail(confirmationCode) {
        //ищу юзера по коду подтверждения
        const user = await users_repository_1.usersRepository.findUserByConfrimationCode(confirmationCode);
        if (!user || user.emailConfirmation.isConfirmed || user.emailConfirmation.expirationDate < new Date()) {
            return false;
        }
        const updated = await users_repository_1.usersRepository.updateEmailStatus(user.id, true);
        return updated;
    },
    async resendCode(email) {
        const user = await users_repository_1.usersRepository.findUserByEmail(email);
        if (!user || user.emailConfirmation.isConfirmed) {
            return false;
        }
        const newCode = (0, uuid_1.v4)();
        const newExpirationData = (0, date_fns_1.add)(new Date(), { hours: 1 });
        const updateInDb = await users_repository_1.usersRepository.updateConfirmationCode(user.id, newCode, newExpirationData);
        if (!updateInDb) {
            return false;
        }
        const FRONTEND_CONFIRM_URL = process.env.FRONTEND_CONFIRM_URL || 'http://localhost:3000/confirm-email';
        const confirmationLink = `${FRONTEND_CONFIRM_URL}?code=${newCode}`;
        try {
            await email_adapters_1.emailAdapter.sendEmail(email, 'Переотправка кода подтверждения', `<h1>Переотправка кода подтверждения</h1>
                 <p>Вы запросили новый код подтверждения. Пожалуйста, перейдите по ссылке ниже:</p>
                 <a href='${confirmationLink}'>Подтвердить email</a>
                 <p>Если вы не запрашивали это, просто проигнорируйте это письмо.</p>`);
        }
        catch (emailError) {
            console.error('Error sending resend email:', emailError);
            return false;
        }
        return true;
    }
};
