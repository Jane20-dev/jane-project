"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRoute = void 0;
const express_1 = require("express");
const db_1 = require("./repositories/db");
const db_2 = require("./repositories/db");
const posts_repository_1 = require("./repositories/posts-repository");
const mongodb_1 = require("mongodb");
const comments_repository_1 = require("./repositories/comments-repository");
const auth_1 = require("./auth");
exports.postRoute = (0, express_1.Router)();
exports.postRoute.get('/', async (req, res) => {
    const queryParams = {
        sortBy: typeof req.query.sortBy === 'string' ? req.query.sortBy : "createdAt",
        pageSize: Number(req.query.pageSize) || 10,
        pageNumber: Number(req.query.pageNumber) || 1,
        sortDirection: (req.query.sortDirection === 'asc' || req.query.sortDirection === 'desc') ? req.query.sortDirection : 'desc',
        searchNameTerm: typeof req.query.searchNameTerm === 'string' ? req.query.searchNameTerm : ""
    };
    const posts = await posts_repository_1.postsRepository.findPostsList(queryParams);
    res.status(200).send(posts);
});
exports.postRoute.get('/:id', async (req, res) => {
    const post = await posts_repository_1.postsRepository.findPostsbyId(req.params.id);
    console.log(post, " post in controller");
    if (post) {
        res.status(200).send(post);
    }
    else {
        res.status(404).send({ message: 'Post is not found' });
    }
});
const findBlogById = async (id) => {
    return await db_1.blogCollection.findOne({ _id: new mongodb_1.ObjectId(id) });
};
exports.postRoute.post('/', async (req, res) => {
    const { title, shortDescription, content, blogId, blogName, createdAt } = req.body;
    const errorsMessages = [];
    const isHeaders = req.headers['authorization'];
    if (!isHeaders || !isHeaders.startsWith('Basic ')) {
        return res.status(401).send('Unauthorized');
    }
    const base64Credentials = isHeaders.split(' ')[1];
    const loginDetails = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = loginDetails.split(':');
    if (base64Credentials !== 'YWRtaW46cXdlcnR5' || username !== 'admin' || password !== 'qwerty') {
        return res.status(401).send('Unauthorized');
    }
    if (!title || title.trim().length === 0 || title.length > 30) {
        errorsMessages.push({ message: 'not valid title', field: 'title' });
    }
    if (!shortDescription || shortDescription.trim().length === 0 || shortDescription.length > 100) {
        errorsMessages.push({ message: 'not valid short description', field: 'shortDescription' });
    }
    if (!content || content.trim().length === 0 || content.length > 1000) {
        errorsMessages.push({ message: 'not valid content', field: 'content' });
    }
    if (!blogId || typeof blogId !== 'string' || blogId.length !== 24) {
        errorsMessages.push({ message: 'Invalid blogId format', field: 'blogId' });
    }
    else {
        const blog = await db_1.blogCollection.findOne({ _id: new mongodb_1.ObjectId(blogId) });
        if (!blog) {
            errorsMessages.push({ message: 'blog not found', field: 'blogId' });
        }
    }
    if (errorsMessages.length > 0) {
        return res.status(400).send({ errorsMessages });
    }
    try {
        const newPost = await posts_repository_1.postsRepository.createPosts(title, shortDescription, content, blogId);
        if (!newPost)
            return res.sendStatus(404);
        return res.status(201).send(newPost);
    }
    catch (error) {
        console.log(error, " error");
        return res.status(500).send('Error creating post');
    }
});
exports.postRoute.post('/:postId/comments', auth_1.authenticateToken, async (req, res) => {
    const postId = req.params.postId;
    const { content } = req.body; //тело запроса
    let post;
    try {
        post = await db_2.postsCollection.findOne({ _id: new mongodb_1.ObjectId(postId) });
    }
    catch (e) {
        console.error("Error finding post by ObjectId:", e); // Логируем ошибку, если postId невалиден
        return res.sendStatus(404);
    }
    if (!post) {
        return res.sendStatus(404);
    }
    if (!content || typeof content !== 'string' || content.length < 20 || content.length > 300) {
        return res.status(400).send({
            errorsMessages: [{ message: 'Incorrect content length or type', field: 'content' }]
        });
    }
    if (!req.user || !req.user.userId || !req.user.userLogin) {
        return res.sendStatus(500);
    }
    const userId = req.user.userId;
    const userLogin = req.user.userLogin;
    try {
        const newComment = await comments_repository_1.commentsRepository.createComment(postId, content, req.user.userId, req.user.userLogin);
        console.log("Контроллер: Получено из репозитория (newComment):", newComment);
        if (newComment) {
            return res.status(201).send(newComment);
        }
        else {
            return res.status(500).send({ message: 'Failed to create comm' });
        }
    }
    catch (error) {
        console.error("Контроллер: Необработанная ошибка в роуте POST /comments:", error);
        return res.status(500).send({ message: 'Internal Server Error' });
    }
});
exports.postRoute.get('/:postId/comments', async (req, res) => {
    const postIdFromUrl = req.params.postId;
    try {
        const postExists = await db_2.postsCollection.findOne({ _id: new mongodb_1.ObjectId(postIdFromUrl) });
        if (!postExists) {
            return res.status(404).send({ message: 'Post not found' });
        }
    }
    catch (error) {
        return res.status(500).send({ message: 'Int Server error' });
    }
    const pageSize = Number(req.query.pageSize) || 10;
    const pageNumber = Number(req.query.pageNumber) || 1;
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'createdAt';
    const sortDirection = (req.query.sortDirection === 'asc' || req.query.sortDirection === 'desc')
        ? req.query.sortDirection
        : 'desc';
    const queryForRepository = {
        pageNumber: pageNumber,
        pageSize: pageSize,
        sortBy: sortBy,
        sortDirection: sortDirection
    };
    try {
        const pagedComments = await comments_repository_1.commentsRepository.getCommentForPost(postIdFromUrl, queryForRepository);
        return res.status(200).send(pagedComments);
    }
    catch (error) {
        return res.status(500).send({ message: 'Int server error' });
    }
});
exports.postRoute.put('/:id', async (req, res) => {
    const { title, shortDescription, content, blogId } = req.body;
    const errorsMessages = [];
    const blog = findBlogById(blogId);
    const postId = req.params.id;
    const isHeaders = req.headers['authorization'];
    if (!isHeaders) {
        return res.status(401).send('Unauthorized');
    }
    if (!isHeaders) {
        return res.status(401).send('Unauthorized');
    }
    if (!isHeaders.startsWith('Basic ')) {
        return res.status(401).send('Unauthorized');
    }
    const base64Credentials = isHeaders.split(' ')[1];
    const loginDetails = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = loginDetails.split(':');
    if (base64Credentials !== 'YWRtaW46cXdlcnR5') {
        return res.status(401).send('Unauthorized');
    }
    if (username !== 'admin' || password !== 'qwerty') {
        return res.status(401).send('Unauthorized');
    }
    if (!blog) {
        //return res.status(404).send({message: 'Blog not found'})
        errorsMessages.push({ message: 'blog not found', field: 'blogId' });
    }
    if (!title || title.trim().length === 0 || title.length > 30) {
        errorsMessages.push({ message: 'title is too long', field: 'title' });
    }
    if (!shortDescription || shortDescription.trim().length === 0 || shortDescription.length > 100) {
        errorsMessages.push({ message: 'description is not right or too long', field: 'shortDescription' });
    }
    if (!content || content.trim().length === 0 || content.length > 1000) {
        errorsMessages.push({ message: 'symbols of content is too long', field: 'content' });
    }
    if (!blogId) {
        errorsMessages.push({ message: 'blog ID not correct', field: 'blogId' });
    }
    if (!blogId || typeof blogId !== 'string' || blogId.length !== 24) {
        errorsMessages.push({ message: 'Invalid blogId format', field: 'blogId' });
    }
    else {
        const blog = await db_1.blogCollection.findOne({ _id: new mongodb_1.ObjectId(blogId) });
        if (!blog) {
            errorsMessages.push({ message: 'blog not found', field: 'blogId' });
        }
    }
    if (errorsMessages.length > 0) {
        return res.status(400).send({ errorsMessages });
    }
    const updatedPosts = await posts_repository_1.postsRepository.updatedPosts(postId, title, shortDescription, content, blogId);
    if (updatedPosts) {
        return res.sendStatus(204);
    }
    else {
        return res.sendStatus(404);
    }
});
exports.postRoute.delete('/:id', async (req, res) => {
    const isHeaders = req.headers['authorization'];
    if (!isHeaders) {
        return res.status(401).send('Unauthorized');
    }
    if (!isHeaders) {
        return res.status(401).send('Unauthorized');
    }
    if (!isHeaders.startsWith('Basic ')) {
        return res.status(401).send('Unauthorized');
    }
    const base64Credentials = isHeaders.split(' ')[1];
    const loginDetails = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = loginDetails.split(':');
    if (base64Credentials !== 'YWRtaW46cXdlcnR5') {
        return res.status(401).send('Unauthorized');
    }
    if (username !== 'admin' || password !== 'qwerty') {
        return res.status(401).send('Unauthorized');
    }
    const deletedPosts = await posts_repository_1.postsRepository.deletedPostsbyId(req.params.id);
    if (deletedPosts) {
        return res.sendStatus(204);
    }
    else {
        return res.sendStatus(404);
    }
});
function findPostsList(blogId, postData) {
    throw new Error('Function not implemented.');
}
function findPostsbyId(blogId) {
    throw new Error('Function not implemented.');
}
