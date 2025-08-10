"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsRepository = void 0;
const uuid_1 = require("uuid");
const mongodb_1 = require("mongodb");
const db_1 = require("../db/db");
const db_2 = require("../db/db");
const db_3 = require("../db/db");
const startServer = async () => {
    await (0, db_3.runDb)();
};
startServer();
exports.postsRepository = {
    async findPostsList(query) {
        const allPosts = await db_1.postsCollection.find().toArray();
        let filteredPosts = [...allPosts];
        console.log('Search term:', query.searchNameTerm);
        //ФИЛЬТРАЦИЯ ПО ИМЕНИ
        if (query.searchNameTerm) {
            const searchTerm = query.searchNameTerm.toLowerCase(); //если не undefined
            filteredPosts = filteredPosts.filter(post => post.blogName.toLowerCase().includes(searchTerm));
        }
        //СОРТИРОВКА
        if (query.sortBy) {
            filteredPosts.sort((a, b) => {
                const aValue = a[query.sortBy];
                const bValue = b[query.sortBy];
                if (query.sortDirection === 'asc') {
                    return aValue < bValue ? -1 : 1;
                }
                else {
                    return aValue > bValue ? -1 : 1;
                }
            });
        }
        const pageSize = query.pageSize || 10;
        const pageNumber = query.pageNumber || 1;
        const startIndex = (pageNumber - 1) * pageSize;
        //сама пагинация
        const paginatedPosts = filteredPosts.slice(startIndex, startIndex + pageSize);
        return {
            pagesCount: Math.ceil(filteredPosts.length / pageSize),
            page: pageNumber,
            pageSize: pageSize,
            totalCount: filteredPosts.length,
            items: paginatedPosts.map(post => ({
                id: post._id.toString(),
                createdAt: post.createdAt,
                blogId: post.blogId,
                title: post.title,
                shortDescription: post.shortDescription,
                content: post.content,
                blogName: post.blogName
            })),
        };
    },
    //по блог айди ищем все
    async createNewPost(blogId, postData) {
        const newPostbyBlogId = {
            id: (0, uuid_1.v4)(),
            createdAt: new Date().toISOString(),
            blogId,
            ...postData,
        };
        const createPost = await db_1.postsCollection.insertOne(newPostbyBlogId);
        return {
            createdAt: newPostbyBlogId.createdAt,
            blogId: newPostbyBlogId.blogId,
            id: createPost.insertedId.toString(),
            title: newPostbyBlogId.title,
            shortDescription: newPostbyBlogId.shortDescription,
            content: newPostbyBlogId.content,
            blogName: newPostbyBlogId.blogName
        };
    },
    async findPostsByBlogId(blogId, filters) {
        const { sortBy, sortDirection, pageSize, pageNumber: page } = filters;
        const totalCount = await db_1.postsCollection.countDocuments({ blogId });
        const posts = await db_1.postsCollection.find({ blogId })
            .sort({ [sortBy]: sortDirection })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .toArray();
        return {
            pagesCount: Math.ceil(totalCount / pageSize),
            page,
            pageSize,
            totalCount,
            items: posts.map(post => ({
                id: post._id.toString(),
                createdAt: post.createdAt,
                blogId: post.blogId,
                title: post.title,
                shortDescription: post.shortDescription,
                content: post.content,
                blogName: post.blogName
            }))
        };
    },
    async findPostsbyId(id) {
        const post = await db_1.postsCollection.findOne({ _id: new mongodb_1.ObjectId(id) });
        console.log(post, " post");
        if (!post) {
            return null;
        }
        else {
            return {
                id: post._id.toString(),
                createdAt: post.createdAt,
                blogId: post.blogId,
                title: post.title,
                shortDescription: post.shortDescription,
                content: post.content,
                blogName: post.blogName
            };
        }
    },
    async createPosts(title, shortDescription, content, blogId) {
        if (!mongodb_1.ObjectId.isValid(blogId)) {
            throw new Error('Invalid blogId format');
        }
        const blog = await findBlogById(blogId); // Получаем блог по ID
        if (!blog) {
            return null;
        }
        const newPost = {
            title,
            shortDescription,
            content,
            blogId,
            blogName: blog.name, // Имя блога
            createdAt: new Date().toISOString(),
        };
        const createPost = await db_1.postsCollection.insertOne(newPost);
        return {
            title: newPost.title,
            shortDescription: newPost.shortDescription,
            content: newPost.content,
            blogId: newPost.blogId,
            blogName: newPost.blogName,
            createdAt: newPost.createdAt,
            id: createPost.insertedId
        };
    },
    async updatedPosts(id, title, shortDescription, content, blogId) {
        const result = await db_1.postsCollection.updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: { title, shortDescription, content, blogId } });
        if (result.modifiedCount > 0) {
            return true;
        }
        else {
            return false;
        }
    },
    async deletedPosts() {
        return await db_1.postsCollection.deleteMany({});
    },
    async deletedPostsbyId(id) {
        const result = await db_1.postsCollection.deleteOne({ _id: new mongodb_1.ObjectId(id) });
        return result.deletedCount > 0;
    }
};
const findBlogById = async (id) => {
    return await db_2.blogCollection.findOne({ _id: new mongodb_1.ObjectId(id) });
};
