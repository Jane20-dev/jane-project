"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsRepository = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../db/db");
const db_2 = require("../db/db");
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
            const { _id, postId: commentPostIdFromDb, ...commentForClient } = newCommentToInsert;
            return commentForClient;
        }
        catch (error) {
            console.error("Репозиторий: ОШИБКА при вставке комментария:", error);
            return null;
        }
    },
    async getCommentForPost(postId, query) {
        const { sortBy = 'createdAt', sortDirection = 'desc', pageNumber = 1, pageSize = 10, } = query;
        const filter = { postId: postId };
        const sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = sortDirection === 'desc' ? -1 : 1;
        }
        try {
            // Получаем комментарии с пагинацией и сортировкой
            const comments = await db_2.commentsCollection
                .find(filter)
                .sort(sortOptions)
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize)
                .toArray();
            const totalCount = await db_2.commentsCollection.countDocuments(filter);
            const formattedComments = comments.map(comment => {
                const { _id, postId, ...rest } = comment;
                return rest;
            });
            return {
                pagesCount: Math.ceil(totalCount / pageSize),
                page: pageNumber,
                pageSize: pageSize,
                totalCount: totalCount,
                items: formattedComments
            };
        }
        catch (error) {
            console.error('ошибка получения комментария');
            return {
                pagesCount: 0,
                page: pageNumber,
                pageSize: pageSize,
                totalCount: 0,
                items: []
            };
        }
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
        return result.matchedCount === 1;
    },
    async deleteCommentById(commentId) {
        return await db_2.commentsCollection.deleteOne({ id: commentId });
    }
};
