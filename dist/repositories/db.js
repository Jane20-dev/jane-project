"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsCollection = exports.usersCollection = exports.postsCollection = exports.blogCollection = exports.runDb = void 0;
const mongodb_1 = require("mongodb");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Conection URL
const url = process.env.URL;
console.log('url :', url);
if (!url) {
    throw new Error('URL DOES NOT FOUND');
}
const client = new mongodb_1.MongoClient(url);
const dbName = 'JannyProject';
const runDb = async () => {
    try {
        await client.connect();
        console.log('Connected successfully to server');
    }
    catch (e) {
        console.error(e, 'Dont connected successfully to server');
        await client.close();
    }
};
exports.runDb = runDb;
exports.blogCollection = client.db().collection('blog');
exports.postsCollection = client.db().collection('post');
exports.usersCollection = client.db().collection('users');
exports.commentsCollection = client.db().collection('comments');
