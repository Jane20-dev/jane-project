"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRoute = void 0;
const express_1 = require("express");
const settings_1 = require("./settings");
const express_2 = __importDefault(require("express"));
const db_1 = require("./repositories/db");
const posts_repository_1 = require("./repositories/posts-repository");
const mongodb_1 = require("mongodb");
exports.postRoute = (0, express_1.Router)();
settings_1.app.use(express_2.default.json());
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
// const findBlogById = (id: string) => {
//     return blogs.find(blog => blog.id === id)
// }
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
    // const existingPost = await postsRepository.findPostsbyId(blogId);
    // if (!existingPost) {
    //     return res.sendStatus(404); // Блог не найден
    // }
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
