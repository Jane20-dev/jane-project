import { v4 as uuidv4 } from 'uuid';
import {CommentatorInfoType, CommentType, postsCollection, PostType} from './db'
import {runDb} from './db'
import { commentsCollection } from './db';
import { ObjectId } from 'mongodb';


const startServer = async () => {
    await runDb()
}

startServer()

export const commentsRepository = {
    async createComment (
    postId: string,
    content: string,
    userId: string,
    userLogin: string
        
        
): Promise<CommentType | null>{
    const newCommentToInsert ={
        _id: new ObjectId(),
        id: uuidv4(),
        content: content,
        commentatorInfo:{
            userId:userId,
            userLogin:userLogin,
        },
       createdAt: new Date().toISOString(),
       postId: postId
    };

    try {
        await commentsCollection.insertOne(newCommentToInsert)

        const createdComment: CommentType = {
        id: newCommentToInsert.id,
        content: newCommentToInsert.content,
        commentatorInfo: newCommentToInsert.commentatorInfo,
        createdAt: newCommentToInsert.createdAt,

    };
    return createdComment;


    } catch (error) {
        console.error("Репозиторий: ОШИБКА при вставке комментария:", error); // Важно: есть ли тут логи?
        return null; 
    }

   
    // console.log('New comment', newComment);
    // await commentsCollection.insertOne(newComment);

    // const{_id, ...commentWithoutId} = newComment as any;
    // return commentWithoutId;
},

async findCommentById(commentId: string): Promise <CommentType | null>{
    return await commentsCollection.findOne({id: commentId})
},

async updateCommentById(commentId: string, content: string): Promise <boolean>{
    const filter = {id: commentId};

    const updateDoc = {
        $set:{
            content: content,
        }
    }
    const result = await commentsCollection.updateOne(filter, updateDoc);
    return result.matchedCount === 1; //проверяем что был найден и обновлен один коммент
},
}

//createComment
//deleteComment
