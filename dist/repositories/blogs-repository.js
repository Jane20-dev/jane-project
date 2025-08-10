"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogsRepository = void 0;
const db_1 = require("../db/db");
const mongodb_1 = require("mongodb");
const db_2 = require("../db/db");
const startServer = async () => {
    await (0, db_2.runDb)();
};
startServer();
exports.blogsRepository = {
    async findBlogsList(query) {
        //получаю все блоги
        const allBlogs = await db_1.blogCollection.find().toArray();
        let filteredBlogs = [...allBlogs];
        //ФИЛЬТРАЦИЯ ПО ИМЕНИ
        if (query.searchNameTerm) {
            const searchTerm = query.searchNameTerm.toLowerCase(); //один раз я привожу к нижнему регистру
            filteredBlogs = filteredBlogs.filter(blog => blog.name.toLowerCase().includes(searchTerm.toLocaleLowerCase()));
        }
        //СОРТИРОВКА
        if (query.sortBy) {
            filteredBlogs.sort((a, b) => {
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
        const paginatedBlogs = filteredBlogs.slice(startIndex, startIndex + pageSize);
        return {
            pagesCount: Math.ceil(filteredBlogs.length / pageSize),
            page: pageNumber,
            pageSize: pageSize,
            totalCount: filteredBlogs.length,
            items: paginatedBlogs.map(blog => ({
                id: blog._id.toString(),
                name: blog.name,
                description: blog.description,
                websiteUrl: blog.websiteUrl,
                isMembership: blog.isMembership,
                createdAt: blog.createdAt
            })),
        };
    },
    async findBlogsbyId(id) {
        //map
        const blog = await db_1.blogCollection.findOne({ _id: new mongodb_1.ObjectId(id) });
        if (!blog) {
            return null;
        }
        else {
            return {
                id: blog._id.toString(),
                createdAt: blog.createdAt,
                description: blog.description,
                isMembership: blog.isMembership,
                name: blog.name,
                websiteUrl: blog.websiteUrl,
            };
        }
    },
    async createBlogs(name, description, websiteUrl, createdAt, isMembership) {
        const newBlog = {
            name,
            description,
            websiteUrl,
            createdAt: new Date(),
            isMembership: false,
        };
        const createdBlog = await db_1.blogCollection.insertOne(newBlog);
        return {
            name: newBlog.name,
            description: newBlog.description,
            websiteUrl: newBlog.websiteUrl,
            createdAt: newBlog.createdAt.toISOString(),
            isMembership: newBlog.isMembership,
            id: createdBlog.insertedId
        };
    },
    async updatedBlogs(id, name, description, websiteUrl) {
        const result = await db_1.blogCollection.updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: { name, description, websiteUrl } });
        if (result.modifiedCount > 0) {
            return true;
        }
        else {
            return false;
        }
    },
    async deletedBlogs() {
        return await db_1.blogCollection.deleteMany({});
    },
    async deletedBlogsbyId(id) {
        const result = await db_1.blogCollection.deleteOne({ _id: new mongodb_1.ObjectId(id) });
        return result.deletedCount > 0;
    }
};
