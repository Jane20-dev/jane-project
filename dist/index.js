"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const blogs_1 = require("./blogs");
const posts_1 = require("./posts");
const users_1 = require("./users");
const auth_1 = require("./auth");
const comments_1 = require("./comments");
const db_1 = require("./repositories/db");
exports.app = (0, express_1.default)();
const port = 3000;
exports.app.use(body_parser_1.default.json());
exports.app.use('/auth', auth_1.authRoute);
exports.app.use('/blogs', blogs_1.blogRoute);
exports.app.use('/posts', posts_1.postRoute);
exports.app.use('/users', users_1.userRoute);
exports.app.use('/comments', comments_1.commentRoute);
exports.app.delete('/testing/all-data', async (req, res) => {
    console.log('Clearing all data');
    await db_1.postsCollection.deleteMany({});
    await db_1.blogCollection.deleteMany({});
    await db_1.usersCollection.deleteMany({});
    await db_1.commentsCollection.deleteMany({});
    return res.sendStatus(204);
});
const startApp = async () => {
    await (0, db_1.runDb)();
};
exports.app.listen(port, () => {
    console.log('Example app listening on port :' + port);
});
startApp();
