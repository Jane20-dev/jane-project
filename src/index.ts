import express, {Request, Response, Router} from 'express'
import bodyParser from "body-parser";
import { blogRoute } from './routes/blogs';
import { postRoute } from './routes/posts';
import { userRoute } from './routes/users';
import { authRoute } from './routes/auth';
import { commentRoute } from './routes/comments';
import {blogCollection, postsCollection, usersCollection, commentsCollection, runDb} from './repositories/db'
import cookieParser from 'cookie-parser';


export const app = express()
const port = 3000

app.use(cookieParser());
app.use(bodyParser.json());

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
    return res.sendStatus(204)

});

const startApp = async()=>{
    await runDb()
}


app.listen(port, ()=> {
    console.log('Example app listening on port :' + port)
})

startApp()