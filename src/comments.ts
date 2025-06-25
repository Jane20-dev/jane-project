import {Request, Response, Router} from "express"
import { commentsRepository } from "./repositories/comments-repository";
import { commentsCollection } from "./repositories/db";
import { authenticateToken } from "./auth";
import { TokenPayload } from "./utils/jwt";

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload;
  }
}
export const commentRoute = Router();


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

});

commentRoute.delete('/:commentId',authenticateToken, async (req: Request, res:Response)=>{
    const commentId = req.params.commentId;
    const userIdFromToken = req.user?.userId;

    if (!userIdFromToken) {
        return res.status(401).send({ message: 'User ID not found in token.' });
    }

    try {
        const comment = await commentsCollection.findOne({id: commentId});
        if(!comment){
            return res.status(404).send({message: 'Comment not found'});
        }
        if (comment.commentatorInfo.userId !== userIdFromToken) {
    
            return res.status(403).send({ message: 'You are not the owner of this comment.' });
        }
        const deletedComment = await commentsRepository.deleteCommentById(commentId);
        if(deletedComment.deletedCount === 0){
            return res.status(404).send({message: 'Cannot delete comment'})
        }
        return res.status(204).send({message:'deleted comment'})
    } catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).send('Error deleting comment')
        
    }
});

commentRoute.put('/:commentId',authenticateToken, async(req: Request, res: Response)=>{
    const commentId = req.params.commentId;
    const {content} = req.body;
    const errorsMessages = [];

    if(!content || typeof content !== 'string' || content.trim().length < 20 || content.trim().length > 300){
        errorsMessages.push({message: 'Content is wrong!', field: 'content'});
    }

    if(errorsMessages.length > 0){
        return res.status(400).json({errorsMessages});
    }

    const userIdFromToken = req.user?.userId;

    if(!userIdFromToken){
        return res.status(403).send({message: 'Token has not user data!'});
    }

    const commentNow = await commentsCollection.findOne({id: commentId});

    if(!commentNow){
        return res.status(404).send({message: 'Comment not found!'});
    }

    if(commentNow.commentatorInfo.userId !== userIdFromToken){
        return res.status(403).send({message: 'Forbidden: You are not the owner of this comment.'});
    }

    try {
        const updateComment = await commentsRepository.updateCommentById(commentId, content)
        if(!updateComment){
            return res.status(404).send({message: 'Cannot update comment'})
        }
        return res.status(204).send({message:'Comment is updated!'})

    } catch (error) {
        console.error("Error updt comment:", error);
        return res.status(500).send('Error updt commnet')
    }
})


//commentRoute.update(id)
//commentRoute.delete(id)

