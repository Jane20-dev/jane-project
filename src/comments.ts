import {Request, Response, Router} from "express"
import {app} from './settings';
import express from 'express';
import { ObjectId } from "mongodb";
import { commentsRepository } from "./repositories/comments-repository";
import { commentsCollection } from "./repositories/db";
import { authenticateToken } from "./auth";
import { postsCollection } from "./repositories/db";

export const commentRoute = Router();
app.use(express.json());


// commentRoute.post('/:postId', authenticateToken, async (req: Request, res: Response)=>{
//     const postId = req.params.postId;
//     const {content} = req.body;
//     const errorsMessages = [];

//     if(!ObjectId.isValid(postId)){
//         errorsMessages.push({message:'Post not found', field: postId});

//     }

//     if (!content || typeof content !== 'string' || content.length < 20 || content.length > 300){
//         errorsMessages.push({message: 'Content must be 20-300 symbols', field: 'content'});

//     }
//     if (errorsMessages.length > 0){
//         return res.status(400).send({errorsMessages});

//     }

//     const post = await postsCollection.findOne({_id: new ObjectId(postId)});
//     if(!post){
//         return res.status(400).send({message: 'Post not found'});

//     }

//     if(!req.user || !req.user.userId || !req.user.userLogin){
//         return res.status(500).send({message: 'auth token error'});

//     }

//     try{
//         const newComment = await commentsRepository.createComment(
//             postId,
//             content,
//             req.user.userId,
//             req.user.userLogin
//         )
//         if(newComment){
//             return res.status(201).send(newComment)
//         }else{
//             return res.status(500).send({message: 'Failed to create comment'})
//         }
//     } catch (error) {
//         return res.status(500).send({message: 'Server error'})
//     }



// })
commentRoute.get('/:id', async (req: Request, res: Response) => {
    const commentId = req.params.id;


    try {
        const comment = await commentsCollection.findOne({id: commentId});
        if(!comment){
            return res.status(404).send({message: 'Comment not found'})
        }

        const {_id, postId, ...commentWithoutAnyMongoId} = comment as any;
        return res.status(200).send(commentWithoutAnyMongoId)
    } catch (error) {
        console.error(`GET /comments/:id: Ошибка при получении комментария ${commentId}:`, error);
        return res.status(500).send({message: 'Internal sever Error'})
    }

})


//commentRoute.update(id)
//commentRoute.delete(id)

