import { Request, Response, Router, NextFunction} from 'express';
import { userService } from '../services/auth-service';
import { verifyRefreshToken, verifyAccessToken, TokenPayload, generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { validationResult } from 'express-validator'; 
import { loginValidation,registerValidation , confirmationValidation,resendingValidation} from '../validation/auth-validation';
import { usersRepository } from '../repositories/users-repository';
import { deviceRepository } from '../repositories/device-repository';
import jwt from 'jsonwebtoken';
import {  ipLimiter} from '../middleware/rate-limiter';


declare module 'express-serve-static-core' {
  interface Request {
    userPayload?: TokenPayload; 
    user?: TokenPayload; 
  }
}

export const authRoute = Router();

// --- Middleware для аутентификации JWT токена ---
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
 


  let token = null;
  let isRefreshToken = false;

  const authHeader = req.headers.authorization;


  //авторизация
  if(authHeader && authHeader.startsWith('Bearer')){
   token = authHeader.split(' ')[1]
   console.log('Диагностика: Токен найден в заголовке Authorization.');
  }
    if(req.cookies && req.cookies.refreshToken){
      token = req.cookies.refreshToken;
      isRefreshToken = true; 
    }
  
  

  //  Если токена нет, отправляем 401 Unauthorized
  if (!token) {
    return res.status(401).json({ message: 'Need Bearer token' });
  }

  try {
    
  let decodedPayload: TokenPayload | null = null;

 
  if (!isRefreshToken) {
    decodedPayload = verifyRefreshToken(token)
    
  }else{
    decodedPayload = verifyAccessToken(token)
  }


  if(!decodedPayload?.userId || !decodedPayload?.deviceId || !decodedPayload.jti){
    return res.status(401).json({message: 'Недействительный токеен: Пользователь не найден!'})
  }
  const user = await usersRepository.findUserById(decodedPayload.userId);

    if (!user) {
      return res.status(401).json({ message: 'Недействительный токен: Пользователь не найден!' });
    }


const devicesession = await deviceRepository.findDeviceSessionInDB(decodedPayload.deviceId, decodedPayload.userId, decodedPayload.jti);
if(!devicesession || devicesession.expiresAt < new Date()){
  return res.status(401).send({message: 'Cannot find device in bd'});

}

console.log(`[authenticateToken] Токен декодирован: userId=${decodedPayload.userId}, deviceId=${decodedPayload.deviceId}`);

  req.userPayload = decodedPayload;
  return next()

  } catch (error: any) {
    console.error(`[authenticateToken] Token verification failed:`, error);

    if(error.name === 'TokenExpiredError'){
      return res.status(401).json({message: 'Токен просрочен'})
    }
    if (error.name === 'JsonWebTokenError'){
      return res.status(401).json({ message: 'Недействительный токен.' });
    }

    return res.status(500).json({ message: 'Ошибка аутентификации.' });
    
  }


};

authRoute.post('/registration',ipLimiter(5,10) ,registerValidation, async (req: Request, res: Response) =>{
  const { login, email, password } = req.body;

  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(400).json({errors: errors.array()});
  }
   
  
  try {
   
  const registrationUser =  userService.registerUser(login,email,password);
  if('errorsMessages' in registrationUser){
    return res.status(400).json({errorsMessages: registrationUser.errorsMessages })
  }
  return res.status(204).send();


  } catch (error) {
    console.log('Error during registration', error);
    return res.status(500).json({message: 'Error during registration'})
  }
  

})

authRoute.post('/registration-confirmation', ipLimiter(5,10),  confirmationValidation, async (req: Request, res: Response)=>{
  const {code} = req.body;

  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(400).json({errors: errors.array()});
  }

  try {
    const isConfirmed = await userService.confirmEmail(code)

    if(isConfirmed ){
      return  res.status(204).send();
    }else{
      return res.status(400).json({
        errorsMessages: [{ message: 'Confirmation code is incorrect, expired or already been applied', field: 'code' }]
      });
    }
   
  } catch (error) {
    console.log('Error during confirmation', error);
    return res.status(500).json({message: 'Error during confirmation'})
    
  }
 
})

authRoute.post('/registration-email-resending',  ipLimiter(5, 10),  resendingValidation,   async (req: Request, res: Response)=>{
  const {email} = req.body;

  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(400).json({errors: errors.array()});
  }

  try {
    const resendCodetoEmail =  userService.resendCode(email)
    if(resendCodetoEmail &&'errorsMessages' in resendCodetoEmail){
      return res.status(400).json({errorsMessages: resendCodetoEmail.errorsMessages});
    }
     console.log(`[Auth Route] /registration-email-resending successful for email: '${email}'.`);
     return res.status(204).send()
    
  } catch (error) {
    console.error(`[Auth Route] /registration-email-resending unexpected error for email '${email}':`, error);
    return res.status(500).json({message: 'Internal server error during email resending.'})
    
  }


})

authRoute.get('/me', authenticateToken, async (req: Request, res: Response) => {
 
  if(!req.user){
    return res.status(500).json({message: 'Ошибка сервера'})

  }

  res.status(200).json({
    userId: req.user.userId,
    email: req.user.email,
    login: req.user.userLogin

  });
  return true;


});


authRoute.post('/login',  ipLimiter(5,10),  loginValidation,  async (req: Request, res: Response) => {
  const { loginOrEmail, password } = req.body;
  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(400).json({errors: errors.array()});
  }
    

  try {
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'];
  
    const user = await userService.loginUser(loginOrEmail, password, ip, userAgent);


    if (!user) {
      return res.status(401).send('Unauthorized');
    }
    res.cookie('refreshToken', user.refreshToken,{
      httpOnly: true,
      secure: true,
      maxAge: 20*1000,
    });

    res.status(200).json({accessToken: user.accessToken});
  } catch (error) {
    console.log(error, ' error');
    res.status(500).send('Error during login');
  }

  return true;

  
});
const REFRESH_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7; 

authRoute.post('/refresh-token', async (req: Request, res: Response) => {
    const refreshTokenFromCookie = req.cookies.refreshToken;
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 1. Проверка наличия Refresh Token в куках
    if (!refreshTokenFromCookie) {
        return res.status(401).send('1.Unauthorized');
    }

        
    try {
    const oldDecodedPayload = await userService.refreshTokensSession(refreshTokenFromCookie, ip, userAgent);

        // Если токен недействителен или не содержит нужных данных
    if (!oldDecodedPayload) {
      res.clearCookie('refreshToken');
      return res.status(401).send('2.Invalid or expired refresh token.');
    }

    res.cookie('refreshToken', oldDecodedPayload.refreshToken,{
        httpOnly: true,
        secure: true,
        maxAge: REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000
          
    });

    return res.status(200).json({accessToken: oldDecodedPayload.accessToken})

    } catch (error) {
    res.clearCookie('refreshToken'); 
    return res.status(401).send('3. in the end cannot refresh token');
        
}
      
});

authRoute.post('/logout', async (req: Request, res: Response)=>{
  const refreshTokenFromCookie = req.cookies.refreshToken;

  if(!refreshTokenFromCookie) return res.status(401).send('1. Unauthorized');

  try {

  
    const isLogout = await userService.logoutUser(refreshTokenFromCookie);


      if(!isLogout){
        res.clearCookie('refreshToken');
        return res.status(401).send('3. Unauthorized');
      }


      res.clearCookie('refreshToken');

      res.status(204).send();
  } catch (error) {
    res.clearCookie('refreshToken');
    res.status(401).send('4. Unauthorized');
    
  }
  return true


});




