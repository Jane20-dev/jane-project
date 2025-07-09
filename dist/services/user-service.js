"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
// этот файл будет содержать бизнес-логику:
const users_repository_1 = require("../repositories/users-repository");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const date_fns_1 = require("date-fns");
const jwt_1 = require("../utils/jwt");
const email_adapters_1 = require("../adapters/email-adapters");
exports.userService = {
    async registerUser(login, email, password) {
        const errorsMessages = [];
        const userByLogin = await users_repository_1.usersRepository.findUserByLogin(login);
        if (userByLogin) {
            return { errorsMessages: [{ message: 'Пользователь с таким login уже существует.', field: 'login' }] };
        }
        const userByEmail = await users_repository_1.usersRepository.findUserByEmail(email);
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
    async confirmEmail(confirmationCode) {
        const user = await users_repository_1.usersRepository.findUserByConfrimationCode(confirmationCode);
        console.log(`[UserService.confirmEmail] Attempting to confirm email with code: '${confirmationCode}'`);
        if (!user || user.emailConfirmation.isConfirmed || user.emailConfirmation.expirationDate < new Date()) {
            return false;
        }
        console.log(`[ConfirmEmail Service] Пользователь найден: ${user.login} (${user.email})`);
        console.log(`[ConfirmEmail Service] Код в БД: ${user.emailConfirmation.confirmationCode}`);
        console.log(`[ConfirmEmail Service] Срок действия кода (в БД): ${user.emailConfirmation.expirationDate ? user.emailConfirmation.expirationDate.toISOString() : 'N/A'}`);
        console.log(`[ConfirmEmail Service] Текущее время (сейчас): ${new Date().toISOString()}`);
        const updated = await users_repository_1.usersRepository.updateEmailStatus(user.id, true);
        return updated;
    },
    async loginUser(loginOrEmail, password) {
        console.log(`[UserService.loginUser] Attempting login for: '${loginOrEmail}'`);
        const user = await users_repository_1.usersRepository.findUserByLoginOrEmail(loginOrEmail);
        if (!user) {
            return null;
        }
        // if (!user.emailConfirmation || !user.emailConfirmation.isConfirmed) {
        // console.log(`[Login Service] Email пользователя ${user.login} (${user.email}) не подтвержден.`);
        // return null; // Email не подтвержден
        //  }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            console.warn(`[UserService.loginUser] Login failed for '${user.login}': Password mismatch.`);
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
    async resendCode(email) {
        const user = await users_repository_1.usersRepository.findUserByEmail(email);
        if (!user) {
            return { errorsMessages: [{ message: 'User with this email does not exist.', field: 'email' }] };
        }
        if (user.emailConfirmation.isConfirmed) {
            console.warn(`[UserService.resendConfirmationEmail] Email '${email}' is already confirmed. Cannot resend.`);
            return { errorsMessages: [{ message: 'Email is already confirmed.', field: 'email' }] };
        }
        const newCode = (0, uuid_1.v4)();
        const newExpirationData = (0, date_fns_1.add)(new Date(), { hours: 1 });
        const updateInDb = await users_repository_1.usersRepository.updateConfirmationCode(user.id, newCode, newExpirationData);
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
};
