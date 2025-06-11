import { v4 as uuidv4 } from 'uuid';
import {ObjectId, SortDirection} from 'mongodb';
import {postsCollection, PostType} from './db'
import { blogCollection, BlogType } from './db';
import {runDb} from './db'
import { title } from 'process';
import { BasePagination } from '../types';


const startServer = async () =>{
    await runDb()
}
startServer()

// export const posts: { id: string; title: string; shortDescription: string; content: string; blogId: string; blogName: string; createdAt: string}[] = [];

export const postsRepository = {

    async findPostsList (query:{
        searchNameTerm?: string
        sortBy?: string
        sortDirection?: 'asc' | 'desc'
        pageNumber?: number
        pageSize?: number
    }){


        

        const allPosts = await postsCollection.find().toArray()
        let filteredPosts = [...allPosts]
        
        console.log('Search term:', query.searchNameTerm);


        //ФИЛЬТРАЦИЯ ПО ИМЕНИ
        if(query.searchNameTerm){
            const searchTerm = query.searchNameTerm.toLowerCase() //если не undefined
            filteredPosts = filteredPosts.filter(post => post.blogName.toLowerCase().includes(searchTerm))
        }
        //СОРТИРОВКА
        if (query.sortBy){
            filteredPosts.sort((a, b) => {
                const aValue = a[query.sortBy as keyof typeof a];
                const bValue = b[query.sortBy as keyof typeof b];

                if (query.sortDirection === 'asc') {
                    return aValue < bValue ? -1 : 1;
                } else {
                    return aValue > bValue ? -1 : 1;
                }

            })
        }
        const pageSize = query.pageSize || 10
        const pageNumber = query.pageNumber || 1;
        const startIndex = (pageNumber - 1) * pageSize;
        //сама пагинация
        const paginatedPosts  = filteredPosts.slice(startIndex, startIndex + pageSize);
        


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
    async createNewPost(blogId: string, postData: {title: string; shortDescription: string; content: string; blogName: string})
    {
        const newPostbyBlogId = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            blogId,
            ...postData,
        };
       const createPost = await postsCollection.insertOne(newPostbyBlogId)

        return {
            createdAt: newPostbyBlogId.createdAt,
            blogId: newPostbyBlogId.blogId,
            id: createPost.insertedId.toString(),
            title: newPostbyBlogId.title,
            shortDescription: newPostbyBlogId.shortDescription,
            content: newPostbyBlogId.content,
            blogName: newPostbyBlogId.blogName
        }


    },




    async findPostsByBlogId(blogId: string, filters: Required<BasePagination>){
        const { sortBy , sortDirection , pageSize,pageNumber:page } = filters
        const totalCount = await postsCollection.countDocuments({blogId});
        const posts = await postsCollection.find({blogId})
            .sort({[sortBy]: sortDirection})
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

 
        }
        //пагинация и тд
        // return await postsCollection.find({blogId}).toArray()
    },
    //{ id: string; title: string; shortDescription: string; content: string; blogId: string; blogName: string; createdAt: string; }[]



    


    async findPostsbyId(id: string){

        const post =  await postsCollection.findOne({_id: new ObjectId(id)})
        console.log(post, " post")
        if (!post){
            return null
        }else{
            return {
                id: post._id.toString(),
            createdAt: post.createdAt,
            blogId: post.blogId,
            title: post.title,
            shortDescription: post.shortDescription,
            content: post.content,
            blogName: post.blogName
            }
        }
        
    },



    


    
    async createPosts(title: string, shortDescription: string, content: string, blogId: string) {

        if (!ObjectId.isValid(blogId)){
            throw new Error('Invalid blogId format')
        }
        const blog = await findBlogById(blogId); // Получаем блог по ID
        if(!blog) {
            return null
        }
        const newPost: PostType= {
            // id: uuidv4(),
            title,
            shortDescription,
            content,
            blogId,
            blogName: blog.name,// Имя блога
            createdAt:new Date().toISOString(), 
        };

        const createPost = await postsCollection.insertOne(newPost)

        return {
            title: newPost.title,
            shortDescription: newPost.shortDescription,
            content: newPost.content,
            blogId: newPost.blogId,
            blogName: newPost.blogName,
            createdAt: newPost.createdAt,
            id: createPost.insertedId
        }
    
    

    },
    async updatedPosts(id: string, title: any, shortDescription: any, content: any, blogId: any) {
          const result = await postsCollection.updateOne(
            {_id: new ObjectId(id) },
            {$set: {title,shortDescription,content,blogId}}
        );
        if (result.modifiedCount > 0){
            return true
        }else{
            return false
        }
    
    },
    async deletedPosts(){
        return await postsCollection.deleteMany({})
           
    },
    async deletedPostsbyId(id: string){
        const result = await postsCollection.deleteOne({_id: new ObjectId(id)})
        return result.deletedCount > 0
           
    
            

    }
}
const findBlogById = async (id: string) => {
    return await blogCollection.findOne({ _id: new ObjectId(id) });
}


