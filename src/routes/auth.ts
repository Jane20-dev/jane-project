import { Request, Response, Router, NextFunction} from 'express';
import { userService } from '../services/user-service';
import { verifyRefreshToken, verifyAccessToken, TokenPayload, generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { validationResult } from 'express-validator'; 
import { loginValidation,registerValidation , confirmationValidation,resendingValidation} from '../validation/auth-validation';


declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload; 
  }
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

authRoute.post('/registration', registerValidation, async (req: Request, res: Response) =>{
  const { login, email, password } = req.body;

  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(400).json({errors: errors.array()});
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

authRoute.post('/registration-confirmation',confirmationValidation,  async (req: Request, res: Response)=>{
  const {code} = req.body;

  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(400).json({errors: errors.array()});
  }
  // const errorsMessages = []


  // if(!code || typeof code !== 'string' || code.trim().length === 0 ){
  //   errorsMessages.push({ message: 'Confirmation code is required', field: 'code' });
  // }
  // if (errorsMessages.length > 0){
  //   return res.status(400).send({errorsMessages});
  // }

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

authRoute.post('/registration-email-resending', resendingValidation, async (req: Request, res: Response)=>{
  const {email} = req.body;

  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(400).json({errors: errors.array()});
  }
  // const errorsMessages = []

  // if (!email || typeof email !== 'string' || email.trim().length === 0) {
  //   errorsMessages.push({ message: 'not valid email', field: 'email' });
  // }
  // if (errorsMessages.length > 0){
  //   return res.status(400).send({errorsMessages});
  // }

  try {
    const resendCodetoEmail = await userService.resendCode(email)
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


authRoute.post('/login',loginValidation,  async (req: Request, res: Response) => {
  const { loginOrEmail, password } = req.body;
  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(400).json({errors: errors.array()});
  }
    

  try {
    const user = await userService.loginUser(loginOrEmail, password);
    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      userLogin: user.login,
      email: user.email
    };

    const accessToken = generateAccessToken(tokenPayload);

    const refreshToken = generateRefreshToken(tokenPayload);
    await userService.saveRefreshToken(user.id,refreshToken);

    res.cookie('refreshToken', refreshToken,{
      httpOnly: true,
      secure: true,
      maxAge: 20*1000,
    });

    res.status(200).json({accessToken:accessToken});
  } catch (error) {
    console.log(error, ' error');
    res.status(500).send('Error during login');
  }

  return true;

  
});

authRoute.post('/refresh-token', async (req: Request, res: Response) =>{
  const refreshTokenFromCookie = req.cookies.refreshToken;

  if(!refreshTokenFromCookie) return res.status(401).send('Unauthorized');

  try {
    const decodedPayload: TokenPayload | null = verifyAccessToken(refreshTokenFromCookie)
    if(!decodedPayload || !decodedPayload.jti){
      res.clearCookie('refreshToken');
      return res.status(401).send('Unauthorized');
    } 

    const user = await userService.findRefreshTokeninDb(refreshTokenFromCookie);

    if(!user){
      res.clearCookie('refreshToken');
      return res.status(401).send('Unauthorized');
    }

    const newAccessToken = generateAccessToken({
      userId: user.id,
      userLogin: user.login,
      email: user.email
    });
    const newRefreshToken = generateRefreshToken({ 
        userId: user.id, 
        userLogin: user.login, 
        email: user.email 
    });

    await userService.saveRefreshToken(user.id, newRefreshToken)

    res.cookie('refreshToken', newRefreshToken,{
      httpOnly: true,
      secure: true,
      maxAge: 20*1000,
    });
    res.status(200).json({accessToken: newAccessToken})
  } catch (error) {
    res.clearCookie('refreshToken');
    return res.status(401).send('Unauthorized');
    
  }
  return true;
});

authRoute.post('/logout', async (req: Request, res: Response)=>{
  const refreshTokenFromCookie = req.cookies.refreshToken;

  if(!refreshTokenFromCookie) return res.status(401).send('1. Unauthorized');

  try {

    const checkThisRefreshToken = verifyAccessToken(refreshTokenFromCookie);
      if(!checkThisRefreshToken || !checkThisRefreshToken.jti){
        res.clearCookie('refreshToken');
        return res.status(401).send('2. Unauthorized');
      }

      const isLogout = await userService.revokeRefreshToken(refreshTokenFromCookie);
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




