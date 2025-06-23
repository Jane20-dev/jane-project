"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentRoute = void 0;
const express_1 = require("express");
const settings_1 = require("./settings");
const express_2 = __importDefault(require("express"));
const db_1 = require("./repositories/db");
exports.commentRoute = (0, express_1.Router)();
settings_1.app.use(express_2.default.json());
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
exports.commentRoute.get('/:id', async (req, res) => {
    const commentId = req.params.id;
    try {
        const comment = await db_1.commentsCollection.findOne({ id: commentId });
        if (!comment) {
            return res.status(404).send({ message: 'Comment not found' });
        }
        const { _id, postId, ...commentWithoutAnyMongoId } = comment;
        return res.status(200).send(commentWithoutAnyMongoId);
    }
    catch (error) {
        console.error(`GET /comments/:id: Ошибка при получении комментария ${commentId}:`, error);
        return res.status(500).send({ message: 'Internal sever Error' });
    }
});
//commentRoute.update(id)
//commentRoute.delete(id)
