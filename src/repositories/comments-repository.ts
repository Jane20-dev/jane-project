import { v4 as uuidv4 } from 'uuid';
import {CommentatorInfoType, CommentType, postsCollection, PostType, CommentResponseClientType} from './db'
import {runDb} from './db'
import { commentsCollection } from './db';
import { ObjectId } from 'mongodb';


const startServer = async () => {
    await runDb()
}

startServer()
//pagination
export interface PagedComments {
    pagesCount: number;
    page: number;
    pageSize: number;
    totalCount: number;
    //also add
    items: CommentType[]
}

export const commentsRepository = {
    async createComment (
    postId: string,
    content: string,
    userId: string,
    userLogin: string
        
        
): Promise<CommentResponseClientType | null>{
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

        const {_id, postId: commentPostIdFromDb, ...commentForClient} = newCommentToInsert as any;

        // const createdComment: CommentType = {
        //     id: newCommentToInsert.id,
        //     content: newCommentToInsert.content,
        //     commentatorInfo: newCommentToInsert.commentatorInfo,
        //     createdAt: newCommentToInsert.createdAt,

           
        // };
    return commentForClient as CommentResponseClientType;


    } catch (error) {
        console.error("Репозиторий: ОШИБКА при вставке комментария:", error); // Важно: есть ли тут логи?
        return null; 
    }
},

async getCommentForPost(
postId: string,
query: {
    pageSize?: number ,
    pageNumber?: number ,
    sortBy?: string,
    sortDirection?: 'asc' | 'desc'
    }
): Promise<PagedComments>{
      const {
            sortBy = 'createdAt', 
            sortDirection = 'desc', 
            pageNumber = 1, 
            pageSize = 10, 
        } = query;
    
    const filter: any = {postId: postId}
    const sortOptions: any = {};
    if (sortBy) { 
        sortOptions[sortBy] = sortDirection === 'desc' ? -1 : 1;
    }
     try {
            // Получаем комментарии с пагинацией и сортировкой
            const comments = await commentsCollection
                .find(filter)
                .sort(sortOptions)
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize)
                .toArray();

            // Получаем общее количество документов по фильтру
            const totalCount = await commentsCollection.countDocuments(filter);

            // Форматируем комментарии, исключая _id и postId, как и ранее
            const formattedComments = comments.map(comment => {
                const { _id, postId,...rest } = comment; // postId переименован во избежание конфликта
                return rest as CommentType;
            });

            // Возвращаем объект пагинации, как в вашем usersRepository
            return {
                pagesCount: Math.ceil(totalCount / pageSize),
                page: pageNumber,
                pageSize: pageSize,
                totalCount: totalCount,
                items: formattedComments
            };

        }catch (error){
            console.error('ошибка получения комментария')
            return{
               pagesCount: 0,
                page: pageNumber,
                pageSize: pageSize,
                totalCount: 0,
                items: [] 
            }

        }

   

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

async deleteCommentById(commentId: string){
    return await commentsCollection.deleteOne({id: commentId})

}
}

//createComment
//deleteComment
