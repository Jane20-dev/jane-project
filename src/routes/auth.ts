import { Request, Response, Router, NextFunction} from 'express';
import { userService } from '../services/user-service';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { Jwt } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserType } from '../repositories/db';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

import { usersRepository } from '../repositories/users-repository';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload; 
  }
}

interface AuthLoginBody {
  loginOrEmail: string;
  password: string;
}

interface RegistrationBody{
  login: string;
  email: string;
  password: string;
}

export const authRoute = Router();


// --- Middleware для аутентификации JWT токена ---
export const authenticateToken = (req: Request, res: Response, next: Function) => {
 
  const authHeader = req.headers['authorization'];
  
  if(!authHeader|| !authHeader.startsWith('Bearer')){
    return res.status(401).json({message: 'Need Bearer token'})
  }
  const token = authHeader && authHeader.split(' ')[1];

  //  Если токена нет, отправляем 401 Unauthorized
  if (!token) {
    return res.status(401).json({ message: 'Требуется аутентификация: токен не предоставлен.' });
  }

  try {
    
  const decodedPayload = verifyAccessToken(token);

 
  if (!decodedPayload) {
    return res.status(401).json({ message: 'Недействительный или просроченный токен.' });
  }

  req.user = decodedPayload;
  return next()// Передаем управление дальше, только если все в порядке

  } catch (error) {
    return res.status(403).json({message: 'Токен просрочен'})
  }
};


authRoute.post('/registration', async (req: Request, res: Response) =>{
  const {login, email, password} = req.body as RegistrationBody;
  const errorsMessages = [];

  if(!login || login.trim().length === 0 || typeof login!== 'string' || login.length > 10 || login.length < 3){
    errorsMessages.push({message: 'Data of your login is wrong!', field: 'login'})

  }
  if(!password || password.trim().length === 0 || typeof password!== 'string' || password.length > 20 || password.length < 6){
    errorsMessages.push({message: 'Data of your password is wrong!', field: 'password'})
    
  }
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errorsMessages.push({ message: 'not valid email', field: 'email' });
  }

  if (errorsMessages.length > 0){
    return res.status(400).send({errorsMessages});
  }
  
  try {
   
  const registrationUser = await userService.registerUser(login,email,password);
  if('errorsMessages' in registrationUser){
    return res.status(400).json({errorsMessages: registrationUser.errorsMessages })
  }
  return res.status(204).send();


  } catch (error) {
    console.log('Error during registration', error);
    return res.status(500).json({message: 'Error during registration'})
  }
  

})


authRoute.get('/me', authenticateToken, async (req: Request, res: Response) => {
 
  if(!req.user){
    return res.status(500).json({message: 'Ошибка сервера'})

  }

  res.status(200).json({
    userId: req.user.userId,
    userLogin: req.user.userLogin

  });
  return true;


});


authRoute.post('/registration-confirmation', async (req: Request, res: Response)=>{

})

authRoute.post('/registration-email-resending', async (req: Request, res: Response)=>{

})

authRoute.post('/login',  async (req: Request, res: Response) => {
  const { loginOrEmail, password } = req.body as AuthLoginBody;
  const errorsMessages: { message: string; field: string }[] = [];

  // Валидация входных данных
  if (!loginOrEmail || loginOrEmail.trim().length === 0 || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(loginOrEmail)) {
    errorsMessages.push({ message: 'not valid login or email', field: 'loginOrEmail' });
  }
  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    errorsMessages.push({ message: 'not valid password', field: 'password' });
  }

  if (errorsMessages.length > 0) {
    return res.status(400).send({ errorsMessages });
  }

  try {
    const token = await userService.loginUser(loginOrEmail, password);
    if (!token) {
      return res.status(401).send('Unauthorized');
    }
    res.status(200).send({accessToken:token});
  } catch (error) {
    console.log(error, ' error');
    res.status(500).send('Error during login');
  }

  return true
});



