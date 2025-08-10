import express, {Request, Response, Router} from 'express'
import bodyParser from "body-parser";
import { blogRoute } from './routes/blogs';
import { postRoute } from './routes/posts';
import { userRoute } from './routes/users';
import { authenticateToken, authRoute } from './routes/auth';
import { commentRoute } from './routes/comments';
import {blogCollection, postsCollection, usersCollection, commentsCollection, runDb, deviceSessionsCollection} from './db/db'
import cookieParser from 'cookie-parser';
import { securityRoute } from './routes/security';
import mongoose from 'mongoose';



export const app = express()
const port = 3000

app.set('trust proxy', true) 
app.use(cookieParser());
app.use(bodyParser.json());

 
app.use('/security', securityRoute)
app.use('/auth', authRoute);
app.use('/blogs', blogRoute)
app.use('/posts', postRoute)
app.use('/users', userRoute)
app.use('/comments', commentRoute)


app.delete('/testing/all-data', async (req: Request,res: Response) => {
    console.log('Clearing all data');
    await postsCollection.deleteMany({})
    await blogCollection.deleteMany({})
    await usersCollection.deleteMany({})
    await commentsCollection.deleteMany({})
    await deviceSessionsCollection.deleteMany({})
    return res.sendStatus(204)

});




export const startApp = async () => {
    try {
        // Сначала ждем подключения к БД
        await runDb();
        console.log('Connected successfully to database');
        
        // Возвращаем Promise, который разрешится, когда сервер будет готов
        return new Promise<void>((resolve) => {
            app.listen(port, () => {
                console.log('Example app listening on port :' + port);
                resolve(); // Разрешаем Promise, когда сервер начал слушать порт
            });
        });
    } catch (error) {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    }
};
// const startApp = async()=>{
//     await runDb()
// }


// app.listen(port, ()=> {
//     console.log('Example app listening on port :' + port)
// })

startApp()
