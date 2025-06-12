import { Request, Response, Router } from 'express';
import { userService } from './services/user-service';
import { usersRepository } from './repositories/users-repository';

//всем привет!!!
interface AuthLoginBody {
  loginOrEmail: string;
  password: string;
}

export const authRoute = Router();

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
    const isAuthenticated = await userService.loginUser(loginOrEmail, password);
    if (!isAuthenticated) {
      return res.status(401).send('Unauthorized');
    }
    res.sendStatus(204);
  } catch (error) {
    console.log(error, ' error');
    res.status(500).send('Error during login');
  }

  return true
});