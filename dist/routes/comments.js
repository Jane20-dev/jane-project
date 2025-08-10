"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentRoute = void 0;
const express_1 = require("express");
const comments_repository_1 = require("../repositories/comments-repository");
const db_1 = require("../db/db");
const auth_1 = require("./auth");
exports.commentRoute = (0, express_1.Router)();
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
exports.commentRoute.delete('/:commentId', auth_1.authenticateToken, async (req, res) => {
    var _a;
    const commentId = req.params.commentId;
    const userIdFromToken = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userIdFromToken) {
        return res.status(401).send({ message: 'User ID not found in token.' });
    }
    try {
        const comment = await db_1.commentsCollection.findOne({ id: commentId });
        if (!comment) {
            return res.status(404).send({ message: 'Comment not found' });
        }
        if (comment.commentatorInfo.userId !== userIdFromToken) {
            return res.status(403).send({ message: 'You are not the owner of this comment.' });
        }
        const deletedComment = await comments_repository_1.commentsRepository.deleteCommentById(commentId);
        if (deletedComment.deletedCount === 0) {
            return res.status(404).send({ message: 'Cannot delete comment' });
        }
        return res.status(204).send({ message: 'deleted comment' });
    }
    catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).send('Error deleting comment');
    }
});
exports.commentRoute.put('/:commentId', auth_1.authenticateToken, async (req, res) => {
    var _a;
    const commentId = req.params.commentId;
    const { content } = req.body;
    const errorsMessages = [];
    if (!content || typeof content !== 'string' || content.trim().length < 20 || content.trim().length > 300) {
        errorsMessages.push({ message: 'Content is wrong!', field: 'content' });
    }
    if (errorsMessages.length > 0) {
        return res.status(400).json({ errorsMessages });
    }
    const userIdFromToken = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userIdFromToken) {
        return res.status(403).send({ message: 'Token has not user data!' });
    }
    const commentNow = await db_1.commentsCollection.findOne({ id: commentId });
    if (!commentNow) {
        return res.status(404).send({ message: 'Comment not found!' });
    }
    if (commentNow.commentatorInfo.userId !== userIdFromToken) {
        return res.status(403).send({ message: 'Forbidden: You are not the owner of this comment.' });
    }
    try {
        const updateComment = await comments_repository_1.commentsRepository.updateCommentById(commentId, content);
        if (!updateComment) {
            return res.status(404).send({ message: 'Cannot update comment' });
        }
        return res.status(204).send();
    }
    catch (error) {
        console.error("Error updt comment:", error);
        return res.status(500).send('Error updt commnet');
    }
});
