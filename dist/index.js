"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
// import {blogs } from './repositories/blogs-repository';
const blogs_1 = require("./blogs");
const posts_1 = require("./posts");
const users_1 = require("./users");
const auth_1 = require("./auth");
const db_1 = require("./repositories/db");
const app = (0, express_1.default)();
const port = 3000;
app.use(body_parser_1.default.json());
app.use('/auth', auth_1.authRoute);
app.use('/blogs', blogs_1.blogRoute);
app.use('/posts', posts_1.postRoute);
app.use('/users', users_1.userRoute);
app.delete('/testing/all-data', async (req, res) => {
    console.log('Clearing all data');
    await db_1.postsCollection.deleteMany({});
    await db_1.blogCollection.deleteMany({});
    await db_1.usersCollection.deleteMany({});
    return res.sendStatus(204);
});
const startApp = async () => {
    await (0, db_1.runDb)();
};
app.listen(port, () => {
    console.log('Example app listening on port :' + port);
});
startApp();
