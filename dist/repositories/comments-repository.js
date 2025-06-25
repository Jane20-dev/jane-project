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
            const { _id, postId: commentPostIdFromDb, ...commentForClient } = newCommentToInsert;
            // const createdComment: CommentType = {
            //     id: newCommentToInsert.id,
            //     content: newCommentToInsert.content,
            //     commentatorInfo: newCommentToInsert.commentatorInfo,
            //     createdAt: newCommentToInsert.createdAt,
            // };
            return commentForClient;
        }
        catch (error) {
            console.error("Репозиторий: ОШИБКА при вставке комментария:", error); // Важно: есть ли тут логи?
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
            // Получаем общее количество документов по фильтру
            const totalCount = await db_2.commentsCollection.countDocuments(filter);
            // Форматируем комментарии, исключая _id и postId, как и ранее
            const formattedComments = comments.map(comment => {
                const { _id, postId, ...rest } = comment; // postId переименован во избежание конфликта
                return rest;
            });
            // Возвращаем объект пагинации, как в вашем usersRepository
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
        return result.matchedCount === 1; //проверяем что был найден и обновлен один коммент
    },
    async deleteCommentById(commentId) {
        return await db_2.commentsCollection.deleteOne({ id: commentId });
    }
};
//createComment
//deleteComment
