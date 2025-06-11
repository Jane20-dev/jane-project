"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogRoute = void 0;
const express_1 = require("express");
const blogs_repository_1 = require("./repositories/blogs-repository");
const posts_repository_1 = require("./repositories/posts-repository");
exports.blogRoute = (0, express_1.Router)();
exports.blogRoute.get('/:blogId/posts', async (req, res) => {
    var _a;
    console.log(req.params.blogId, " params");
    const blogId = req.params.blogId;
    const myBlog = await blogs_repository_1.blogsRepository.findBlogsbyId(blogId);
    if (!myBlog) {
        return res.status(404).send({ error: 'Blogs by id not found' });
    }
    const pageSize = Number(req.query.pageSize) || 10;
    const pageNumber = Number(req.query.pageNumber) || 1;
    // получаю все посты для данного блога
    const posts = await posts_repository_1.postsRepository.findPostsByBlogId(blogId, {
        pageNumber,
        pageSize,
        sortBy: (_a = req.query.sortBy) !== null && _a !== void 0 ? _a : "createdAt",
        // @ts-ignore
        sortDirection: ["asc", "desc"].includes(req.query.sortDirection)
            ? req.query.sortDirection
            : "desc",
    });
    //posts - это массив или нет
    // if (!Array.isArray(posts)) {
    //     return res.status(500).send({ error: 'Failed to retrieve posts' });
    // }
    // фильтрую посты для текущей страницы
    // const filteredPosts = posts.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
    // const totalCount = posts.length;
    // const pagesCount = Math.ceil(totalCount / pageSize);
    return res.status(200).send(posts);
    // .send({
    //     pagesCount: posts.pageCount,
    //     page: posts.page,
    //     pageSize: posts.pageSize,
    //     totalCount: posts.totalCount,
    //     items: posts.items
    // });
});
exports.blogRoute.post('/:blogId/posts', async (req, res) => {
    const blogId = req.params.blogId;
    const postData = req.body;
    const errorsMessages = [];
    const isHeaders = req.headers['authorization'];
    if (!isHeaders || !isHeaders.startsWith('Basic')) {
        return res.status(401).send('Unauthorized');
    }
    const base64Credentials = isHeaders.split(' ')[1];
    const loginDetails = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = loginDetails.split(':');
    if (base64Credentials !== 'YWRtaW46cXdlcnR5' || username !== 'admin' || password !== 'qwerty') {
        return res.status(401).send('Unauthorized');
    }
    if (!postData.title || postData.title.trim().length === 0 || postData.title.length > 30) {
        errorsMessages.push({ message: 'not valid title', field: 'title' });
    }
    if (!postData.content || postData.content.trim().length === 0 || postData.content.length > 1000) {
        errorsMessages.push({ message: 'content is wrong', field: 'content' });
    }
    if (!postData.shortDescription || postData.shortDescription.trim().length === 0 || postData.shortDescription.length > 100) {
        errorsMessages.push({ message: 'description is wrong', field: 'shortDescription' });
    }
    const blogExists = await blogs_repository_1.blogsRepository.findBlogsbyId(blogId);
    if (!blogExists) {
        return res.status(404).send({ error: 'Blog not found' });
    }
    if (errorsMessages.length > 0) {
        return res.status(400).send({ errorsMessages });
    }
    postData.blogName = 'New Blog of Janny';
    const newPost = await posts_repository_1.postsRepository.createNewPost(blogId, postData);
    if (!newPost) {
        return res.status(500).send({ error: 'Failed to create post' });
    }
    return res.status(201).send(newPost);
});
exports.blogRoute.get('/', async (req, res) => {
    const queryParams = {
        sortBy: typeof req.query.sortBy === 'string' ? req.query.sortBy : "createdAt",
        pageSize: Number(req.query.pageSize) || 10,
        pageNumber: Number(req.query.pageNumber) || 1,
        sortDirection: (req.query.sortDirection === 'asc' || req.query.sortDirection === 'desc') ? req.query.sortDirection : 'desc',
        searchNameTerm: typeof req.query.searchNameTerm === 'string' ? req.query.searchNameTerm : ""
    };
    const blogs = await blogs_repository_1.blogsRepository.findBlogsList(queryParams);
    res.status(200).send(blogs);
});
exports.blogRoute.get('/:id', async (req, res) => {
    const blog = await blogs_repository_1.blogsRepository.findBlogsbyId(req.params.id);
    if (blog) {
        res.status(200).send(blog);
    }
    else {
        res.status(404).send({ message: 'Blog is not found' });
    }
});
exports.blogRoute.post('/', async (req, res) => {
    const errorsMessages = [];
    const { name, description, websiteUrl } = req.body;
    const isHeaders = req.headers['authorization'];
    // Проверка авторизации
    if (!isHeaders || !isHeaders.startsWith('Basic ')) {
        return res.status(401).send('Unauthorized');
    }
    const base64Credentials = isHeaders.split(' ')[1];
    const loginDetails = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = loginDetails.split(':');
    if (base64Credentials !== 'YWRtaW46cXdlcnR5' || username !== 'admin' || password !== 'qwerty') {
        return res.status(401).send('Unauthorized');
    }
    // Валидация входных данных
    if (!name || name.trim().length === 0 || name.length > 15) {
        errorsMessages.push({ message: 'name is too long', field: 'name' });
    }
    if (!description || description.length > 500) {
        errorsMessages.push({ message: 'description is too long', field: 'description' });
    }
    const urlPattern = /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/;
    if (websiteUrl.length > 100 || !urlPattern.test(websiteUrl)) {
        errorsMessages.push({ message: 'website url is too long', field: 'websiteUrl' });
    }
    if (errorsMessages.length > 0) {
        return res.status(400).send({ errorsMessages });
    }
    // Создание нового блога
    const createdAt = new Date();
    const isMembership = false;
    try {
        const result = await blogs_repository_1.blogsRepository.createBlogs(name, description, websiteUrl, createdAt, isMembership);
        return res.status(201).send(result);
    }
    catch (error) {
        return res.status(500).send('Error creating blog');
    }
});
// const newBlog = blogsRepository.createBlogs(name, description, websiteUrl,createdAt,isMembership);
// return res.status(201).send(newBlog);
exports.blogRoute.put('/:id', async (req, res) => {
    const { name, description, websiteUrl } = req.body;
    const errorsMessages = [];
    const blogId = req.params.id;
    const isHeaders = req.headers['authorization'];
    // Проверка авторизации
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
    if (!name || name.trim() === '' || name.length > 15) {
        errorsMessages.push({ message: 'name by id is too long for finding', field: 'name' });
    }
    if (!description || description.length > 5000) {
        errorsMessages.push({ message: 'description is too long', field: 'description' });
    }
    const urlPattern = /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/;
    if (!websiteUrl || websiteUrl.length > 100 || !urlPattern.test(websiteUrl)) {
        errorsMessages.push({ message: 'websiteUrl is too long or incorrect', field: 'websiteUrl' });
    }
    if (errorsMessages.length > 0) {
        return res.status(400).send({ errorsMessages: errorsMessages });
    }
    // Проверка  блога
    const existingBlog = await blogs_repository_1.blogsRepository.findBlogsbyId(blogId);
    if (!existingBlog) {
        return res.sendStatus(404); // Блог не найден
    }
    const updatedBlogs = blogs_repository_1.blogsRepository.updatedBlogs(blogId, name, description, websiteUrl);
    if (await updatedBlogs) {
        return res.sendStatus(204); // Успешное обновление
    }
    else {
        return res.sendStatus(404); // Блог не найден
    }
});
exports.blogRoute.delete('/testing/all-data', async (req, res) => {
    const wasItDelete = blogs_repository_1.blogsRepository.deletedBlogs();
    if (await wasItDelete) {
        return res.sendStatus(204);
    }
    else {
        return res.sendStatus(404);
    }
});
exports.blogRoute.delete('/:id', async (req, res) => {
    const isHeaders = req.headers['authorization'];
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
    const deletedBlogs = await blogs_repository_1.blogsRepository.deletedBlogsbyId(req.params.id);
    if (deletedBlogs) {
        return res.sendStatus(204); // Успешное обновление
    }
    else {
        return res.sendStatus(404); // Блог не найден
    }
});
function findPostsbyId(blogId) {
    throw new Error('Function not implemented.');
}
