
// 1. Создание user-service.ts
// Этот файл будет содержать бизнес-логику:

// Хэширование пароля с использованием bcrypt.
// Проверка уникальности login и email.
// Логика авторизации с проверкой пароля через bcrypt.

import { usersRepository } from '../repositories/users-repository';
import bcrypt from 'bcryptjs';
import { UserType } from '../repositories/db';


export const userService = {
    async createUser(login: string, email: string, password: string): Promise<UserType | { errorsMessages: { field: string; message: string }[] }> {
      // Проверка уникальности login и email с помощью методов репозитория
      //Если найдется дубликат, вернется ошибка
    const existingUserByLogin = await usersRepository.findUserByLogin(login);
    const existingUserByEmail = await usersRepository.findUserByEmail(email);
    const errorsMessages: {field: string; message: string} [] = [];

        //отправляю ошибку если что-то не так(логин или эмеил)
    if (existingUserByLogin){
     errorsMessages.push({field: 'login', message: 'login should be unique' });

    }
    if(existingUserByEmail){
        errorsMessages.push({field: 'email', message: 'email should be unique'});

    }
    if(errorsMessages.length > 0){
        return{errorsMessages};
    }
    //хэширование пароля
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds)

    //создаю пользователя через репозиторий
    const newUser = await usersRepository.createUser(login, email, passwordHash);
    return newUser;
},
    async loginUser(loginOrEmail: string, password: string): Promise<boolean>{
        const user = await usersRepository.findUserByLoginOrEmail(loginOrEmail);
        if(!user){
            return false;
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        return isMatch;
    },

  
};

