"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsRepository = void 0;
const uuid_1 = require("uuid");
const db_1 = require("./db");
const db_2 = require("./db");
const mongodb_1 = require("mongodb");
const startServer = async () => {
    await (0, db_1.runDb)();
};
startServer();
exports.commentsRepository = {
    async createComment(postId, content, userId, userLogin) {
        const newCommentToInsert = {
            _id: new mongodb_1.ObjectId(),
            id: (0, uuid_1.v4)(),
            content: content,
            commentatorInfo: {
                userId: userId,
                userLogin: userLogin,
            },
            createdAt: new Date().toISOString(),
            postId: postId
        };
        try {
            await db_2.commentsCollection.insertOne(newCommentToInsert);
            const createdComment = {
                id: newCommentToInsert.id,
                content: newCommentToInsert.content,
                commentatorInfo: newCommentToInsert.commentatorInfo,
                createdAt: newCommentToInsert.createdAt,
            };
            return createdComment;
        }
        catch (error) {
            console.error("Репозиторий: ОШИБКА при вставке комментария:", error); // Важно: есть ли тут логи?
            return null;
        }
        // console.log('New comment', newComment);
        // await commentsCollection.insertOne(newComment);
        // const{_id, ...commentWithoutId} = newComment as any;
        // return commentWithoutId;
    },
    async findCommentById(commentId) {
        return await db_2.commentsCollection.findOne({ id: commentId });
    },
    async updateCommentById(commentId, content) {
        const filter = { id: commentId };
        const updateDoc = {
            $set: {
                content: content,
            }
        };
        const result = await db_2.commentsCollection.updateOne(filter, updateDoc);
        return result.matchedCount === 1; //проверяем что был найден и обновлен один коммент
    },
};
//createComment
//deleteComment
