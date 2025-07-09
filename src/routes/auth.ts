import { Request, Response, Router, NextFunction} from 'express';
import { userService } from '../services/user-service';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

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

authRoute.post('/registration', async (req: Request, res: Response) =>{
    const { login, email, password } = req.body as RegistrationBody;
    console.log(`[Auth Route] POST /registration request received. Raw body: ${JSON.stringify(req.body)}`);
    console.log(`[Auth Route] Parsed body: login='${login}', email='${email}'`);

    const errorsMessages = [];


      // Валидация login
    if (!login || login.trim().length === 0 || login.length < 3 || login.length > 10 || !/^[a-zA-Z0-9_-]*$/.test(login)) {
    errorsMessages.push({message: 'not valid login', field: 'login'});
    }
   
    // Валидация email
    if(!email || email.trim().length === 0 || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)){
        errorsMessages.push({message: 'not valid email', field: 'email'});
    }

  // Валидация password
  if (!password || typeof password !== 'string' || password.trim().length === 0 || password.length < 6 || password.length > 20) {
    errorsMessages.push({ message: 'not valid password', field: 'password' });
  }

  if (errorsMessages. length > 0){
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

authRoute.post('/registration-confirmation', async (req: Request, res: Response)=>{
  const {code} = req.body;
  const errorsMessages = []


  if(!code || typeof code !== 'string' || code.trim().length === 0 ){
    errorsMessages.push({ message: 'Confirmation code is required', field: 'code' });
  }
  if (errorsMessages.length > 0){
    return res.status(400).send({errorsMessages});
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

authRoute.post('/registration-email-resending', async (req: Request, res: Response)=>{
  const {email} = req.body;
  const errorsMessages = []

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errorsMessages.push({ message: 'not valid email', field: 'email' });
  }
  if (errorsMessages.length > 0){
    return res.status(400).send({errorsMessages});
  }

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
    userLogin: req.user.userLogin

  });
  return true;


});


authRoute.post('/login',  async (req: Request, res: Response) => {
  const { loginOrEmail, password } = req.body as AuthLoginBody;
  const errorsMessages: { message: string; field: string }[] = [];

  if (!loginOrEmail || loginOrEmail.trim().length === 0) {
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



