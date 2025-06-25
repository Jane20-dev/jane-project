import {Request, Response, Router} from 'express'
import { usersRepository } from './repositories/users-repository';
import { userService } from './services/user-service';


export const userRoute = Router();


const checkBasicAuth = (req: Request, res: Response): boolean => {
    const isHeaders = req.headers['authorization'];
    if (!isHeaders || !isHeaders.startsWith('Basic')) {
        res.status(401).send('Unauthorized');
        return false;
    }
    const base64Credentials = isHeaders.split(' ')[1];
    const loginDetails = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = loginDetails.split(':');
  
    if (username!== 'admin' || password !== 'qwerty' ) {
      res.status(401).send('Unauthorized');
      return false;
    }
  
    return true;
   
}

userRoute.get('/', async (req: Request, res: Response) => {
    if (!checkBasicAuth(req, res)) return;

    const { searchLoginTerm, searchEmailTerm, sortBy = 'createdAt', sortDirection = 'desc', pageNumber = '1', pageSize = '10' } = req.query;

    try {
      const users = await usersRepository.findUsersList({
        searchLoginTerm: searchLoginTerm as string | undefined,
        searchEmailTerm: searchEmailTerm as string | undefined,
        sortBy: sortBy as string,
        sortDirection: sortDirection as 'asc' | 'desc',
        pageNumber: parseInt(pageNumber as string),
        pageSize: parseInt(pageSize as string),
      });
      res.status(200).json(users);
    } catch (error) {
      console.error('Error in GET /users:', error);
      res.status(401).json({ error: 'Unauthorized' });
    }
  });

userRoute.post('/', async (req: Request, res: Response)=> {
    if (!checkBasicAuth(req, res)) return;

    const { login, email, password } = req.body;
    const errorsMessages : {message: string; field: string}[]= [];
   
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
        const result = await userService.createUser(login,email,password);
        if ('errorsMessages' in result) {
            return res.status(400).json(result);
        }

        res.status(201).json({
            id: result.id,
            login: result.login,
            email: result.email,
            createdAt: result.createdAt,

        });
    } catch (error) {
        console.log('Error creating user:', error);
        res.status(500).send('Error creating user');
        
    }

    return true

});


userRoute.delete('/:id', async (req: Request, res: Response)=> {
    if (!checkBasicAuth(req, res)) return;

    const {id} = req.params;

    try {
        const deleted = await usersRepository.deletedUserssbyId(id);
        if(!deleted){
            return res.sendStatus(404);
        }
        res.sendStatus(204);
    } catch (error) {
        res.status(500).send('Error deleting user');
    }
    return true
});