import { Request, Response, Router } from 'express';
import { userService } from './services/user-service';
import { verifyAccessToken, TokenPayload } from './utils/jwt';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload; 
  }
}


interface AuthLoginBody {
  loginOrEmail: string;
  password: string;
}

export const authRoute = Router();


// --- Middleware для аутентификации JWT токена ---
// Этот middleware будет проверять токен перед тем, как запрос дойдет до конечного обработчика маршрута.
export const authenticateToken = (req: Request, res: Response, next: Function) => {
  // 1. Извлекаем заголовок 'Authorization'
  const authHeader = req.headers['authorization'];
  // Ожидаем формат: "Bearer <YOUR_TOKEN>"
  const token = authHeader && authHeader.split(' ')[1];

  // 2. Если токена нет, отправляем 401 Unauthorized
  if (token == null) {
    return res.status(401).json({ message: 'Требуется аутентификация: токен не предоставлен.' });
  }

  // 3. Верифицируем токен с помощью вашей утилиты
  const decodedPayload = verifyAccessToken(token);

  // 4. Если токен недействителен (просрочен, подделан и т.д.)403 Forbidden
  if (!decodedPayload) {
    return res.status(403).json({ message: 'Недействительный или просроченный токен.' });
  }

  // 5. Если токен действителен, прикрепляем декодированную полезную нагрузку к объекту req
  // Теперь информация о пользователе (userId, email, login) будет доступна в req.user

  req.user = decodedPayload;

 

  // 6. Передаем управление следующему middleware или обработчику маршрута
  next();
  
};

authRoute.post('/login', async (req: Request, res: Response) => {
  const { loginOrEmail, password } = req.body as AuthLoginBody;
  const errorsMessages: { message: string; field: string }[] = [];

  // Валидация входных данных
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