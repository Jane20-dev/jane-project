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
const jwt_1 = require("../utils/jwt");
exports.userService = {
    async createUser(login, email, password) {
        // Проверка уникальности login и email с помощью методов репозитория
        //Если найдется дубликат, вернется ошибка
        const existingUserByLogin = await users_repository_1.usersRepository.findUserByLogin(login);
        const existingUserByEmail = await users_repository_1.usersRepository.findUserByEmail(email);
        const errorsMessages = [];
        //отправляю ошибку если что-то не так(логин или эмеил)
        if (existingUserByLogin) {
            errorsMessages.push({ field: 'login', message: 'login should be unique' });
        }
        if (existingUserByEmail) {
            errorsMessages.push({ field: 'email', message: 'email should be unique' });
        }
        if (errorsMessages.length > 0) {
            return { errorsMessages };
        }
        //хэширование пароля
        const saltRounds = 10;
        const passwordHash = await bcryptjs_1.default.hash(password, saltRounds);
        //создаю пользователя через репозиторий
        const newUser = await users_repository_1.usersRepository.createUser(login, email, passwordHash);
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
};
