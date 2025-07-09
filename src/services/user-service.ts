
// этот файл будет содержать бизнес-логику:
import { usersRepository } from '../repositories/users-repository';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { Jwt } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserType } from '../repositories/db';
import {add} from 'date-fns'
import { generateAccessToken, TokenPayload } from '../utils/jwt';
import { emailAdapter } from '../adapters/email-adapters';
type ServiceResult<T> = T | { errorsMessages: { message: string; field: string }[] };




export const userService = {
    async registerUser(login: string, email: string, password: string): Promise<UserType | { errorsMessages: { field: string; message: string }[] }> {
    
    const errorsMessages: {field: string; message: string} [] = [];

    const userByLogin = await usersRepository.findUserByLogin(login);
    if (userByLogin){
     return {errorsMessages: [{message: 'Пользователь с таким login уже существует.', field: 'login'}]}

    }
    const userByEmail = await usersRepository.findUserByEmail(email);
    if(userByEmail){
       return {errorsMessages: [{message: 'Пользователь с таким email уже существует.', field: 'email'}]}
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

   async confirmEmail(confirmationCode: string): Promise<boolean>{
      

    const user = await usersRepository.findUserByConfrimationCode(confirmationCode);
    console.log(`[UserService.confirmEmail] Attempting to confirm email with code: '${confirmationCode}'`);
    if(!user || user.emailConfirmation.isConfirmed || user.emailConfirmation.expirationDate < new Date()){
        return false
    }

    console.log(`[ConfirmEmail Service] Пользователь найден: ${user.login} (${user.email})`);
    console.log(`[ConfirmEmail Service] Код в БД: ${user.emailConfirmation.confirmationCode}`);
    console.log(`[ConfirmEmail Service] Срок действия кода (в БД): ${user.emailConfirmation.expirationDate ? user.emailConfirmation.expirationDate.toISOString() : 'N/A'}`);
    console.log(`[ConfirmEmail Service] Текущее время (сейчас): ${new Date().toISOString()}`);

    const updated = await usersRepository.updateEmailStatus(user.id, true);
    return updated

},


    async loginUser(loginOrEmail: string, password: string): Promise<string | null>{
        console.log(`[UserService.loginUser] Attempting login for: '${loginOrEmail}'`);
        const user = await usersRepository.findUserByLoginOrEmail(loginOrEmail);
        if(!user){
            return null;
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if(!isMatch){
            console.warn(`[UserService.loginUser] Login failed for '${user.login}': Password mismatch.`);
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


   async resendCode(email: string): Promise<ServiceResult<void>>{
        const user = await usersRepository.findUserByEmail(email);

        if(!user){
            return { errorsMessages: [{ message: 'User with this email does not exist.', field: 'email' }] };
        }

        if(user.emailConfirmation.isConfirmed){
            console.warn(`[UserService.resendConfirmationEmail] Email '${email}' is already confirmed. Cannot resend.`);
            return {errorsMessages: [{message: 'Email is already confirmed.', field: 'email'}]};
        }

        const newCode = uuidv4();
        const newExpirationData = add(new Date(), {hours: 1});

        const updateInDb = await usersRepository.updateConfirmationCode(
            user.id,
            newCode,
            newExpirationData
        );

        if(!updateInDb){
            return { errorsMessages: [{ message: 'Failed to update confirmation data.', field: 'email' }] };
        }

        const FRONTEND_CONFIRM_URL = process.env.FRONTEND_CONFIRM_URL;
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
            return;
        } catch (emailError) {
            console.error('Error sending resend email:', emailError);
            return { errorsMessages: [{ message: 'Failed to send confirmation email.', field: 'email' }] };
            
        }
        
}

};

