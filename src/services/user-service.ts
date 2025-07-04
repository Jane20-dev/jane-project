
// 1. Создание user-service.ts
// Этот файл будет содержать бизнес-логику:

// Хэширование пароля с использованием bcrypt.
// Проверка уникальности login и email.
// Логика авторизации с проверкой пароля через bcrypt.

import { usersRepository } from '../repositories/users-repository';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { Jwt } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserType } from '../repositories/db';
import {add} from 'date-fns'
import { generateAccessToken, TokenPayload } from '../utils/jwt';
import { emailAdapter } from '../adapters/email-adapters';




export const userService = {
    async registerUser(login: string, email: string, password: string): Promise<UserType | { errorsMessages: { field: string; message: string }[] }> {
      // Проверка уникальности login и email с помощью методов репозитория
      //Если найдется дубликат, вернется ошибка
    const errorsMessages: {field: string; message: string} [] = [];

    const userByLogin = await usersRepository.findUserByLogin(login);
    if (userByLogin){
     errorsMessages.push({field: 'login', message: 'login should be unique' });

    }
    const userByEmail = await usersRepository.findUserByEmail(email);
    if(userByEmail){
        errorsMessages.push({field: 'email', message: 'email should be unique'});

    }
    if(errorsMessages.length > 0){
        return{errorsMessages};
    }
    //хэширование пароля
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds)

    //код подтверждения и срок его действия
    const confirmationCode = uuidv4();
    const expirationDate = add(new Date(), { hours: 1 });
   
    

    const newUser: UserType = {
        id: uuidv4(),
        login,
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
        emailConfirmation:{
            confirmationCode: confirmationCode,
            expirationDate: expirationDate,
            isConfirmed: false,
        },
    };

    const createdUserResult = await usersRepository.createUser(newUser);
    if(!createdUserResult){
        return {errorsMessages: [{field: 'general', message: 'Failed to create user'}]}
    }

    const FRONTEND_CONFIRM_URL = process.env.FRONTEND_CONFIRM_URL || 'https://somesite.com/confirm-email?code=your_confirmation_code';
    const confirmationLink = `${FRONTEND_CONFIRM_URL}?code=${confirmationCode}`;


    try {
        await emailAdapter.sendEmail(
             email,
                'Подтверждение регистрации',
                `<h1>Спасибо за регистрацию!</h1>
                 <p>Чтобы завершить регистрацию, пожалуйста, перейдите по ссылке ниже:</p>
                 <a href='${confirmationLink}'>Завершить регистрацию</a>
                 <p>Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>`
            );
        
    } catch (emailError) {
         console.error('Error sending confirmation email:', emailError);
         // Если письмо не отправилось, считаем это ошибкой регистрации
        return { errorsMessages: [{ field: 'email', message: 'Failed to send confirmation email' }] };
    }
    return newUser
},  


    async loginUser(loginOrEmail: string, password: string): Promise<string | null>{
        const user = await usersRepository.findUserByLoginOrEmail(loginOrEmail);
        if(!user){
            return null;
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if(!isMatch){
            return null;
        }

        const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        userLogin: user.login
    };

        const token = generateAccessToken(tokenPayload)
        return token;
},
    async confirmEmail(confirmationCode: string): Promise<boolean>{
        //ищу юзера по коду подтверждения
    const user = await usersRepository.findUserByConfrimationCode(confirmationCode);

    if(!user || user.emailConfirmation.isConfirmed || user.emailConfirmation.expirationDate < new Date()){
        return false
    }

    const updated = await usersRepository.updateEmailStatus(user.id, true);
    return updated

},
    async resendCode(email: string): Promise<boolean>{
        const user = await usersRepository.findUserByEmail(email);

        if(!user || user.emailConfirmation.isConfirmed){
            return false;
        }

        const newCode = uuidv4();
        const newExpirationData = add(new Date(), {hours: 1});

        const updateInDb = await usersRepository.updateConfirmationCode(
            user.id,
            newCode,
            newExpirationData
        );

        if(!updateInDb){
            return false
        }

        const FRONTEND_CONFIRM_URL = process.env.FRONTEND_CONFIRM_URL || 'http://localhost:3000/confirm-email';
        const confirmationLink = `${FRONTEND_CONFIRM_URL}?code=${newCode}`;

        try {
            await emailAdapter.sendEmail(
                email,
                'Переотправка кода подтверждения',
                `<h1>Переотправка кода подтверждения</h1>
                 <p>Вы запросили новый код подтверждения. Пожалуйста, перейдите по ссылке ниже:</p>
                 <a href='${confirmationLink}'>Подтвердить email</a>
                 <p>Если вы не запрашивали это, просто проигнорируйте это письмо.</p>`
            )
        } catch (emailError) {
            console.error('Error sending resend email:', emailError);
            return false; 
            
        }
        return true;
    }

};

