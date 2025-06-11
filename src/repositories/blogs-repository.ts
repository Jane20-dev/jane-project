import { v4 as uuidv4 } from 'uuid';
import { blogCollection, BlogType } from './db';
import {ObjectId, SortDirection} from 'mongodb';
import {runDb} from './db'
import { isMemberName } from 'typescript';
import { BasePagination } from '../types';

const startServer = async () =>{
    await runDb()
}
startServer()


// export const blogs: { id: string; name: any; description: any; websiteUrl: any; createdAt : string; isMembership: boolean}[] = []


export const blogsRepository = {

    async findBlogsList(query:{
        searchNameTerm?: string
    } & BasePagination){

        //получаю все блоги
        const allBlogs = await blogCollection.find().toArray()

        let filteredBlogs = [...allBlogs]
        //ФИЛЬТРАЦИЯ ПО ИМЕНИ
        if (query.searchNameTerm){
            const searchTerm = query.searchNameTerm.toLowerCase() //один раз я привожу к нижнему регистру
            filteredBlogs = filteredBlogs.filter(blog => blog.name.toLowerCase().includes(searchTerm.toLocaleLowerCase()))
        }
        //СОРТИРОВКА
        if (query.sortBy){
            filteredBlogs.sort((a, b) => {
                const aValue = a[query.sortBy as keyof typeof a];
                const bValue = b[query.sortBy as keyof typeof b];

                if (query.sortDirection === 'asc') {
                    return aValue < bValue ? -1 : 1;
                } else {
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

    async findBlogsbyId(id: string){
        //map
        const blog =  await blogCollection.findOne({_id: new ObjectId(id)})
        if (!blog){
            return null
        }else{
            return {
                id: blog._id.toString(),
                createdAt: blog.createdAt,
                description: blog.description,
                isMembership: blog.isMembership,
                name: blog.name,
                websiteUrl: blog.websiteUrl,
            }
        }
        
    },

    async createBlogs(name:any, description : any, websiteUrl: any,createdAt : any, isMembership: boolean){
       
        const newBlog: BlogType = {
            // id: uuidv4(),
            name,
            description,
            websiteUrl,
            createdAt:  new Date(),
            isMembership: false,
        };

    
        const createdBlog = await blogCollection.insertOne(newBlog); // Возвращаем созданный блог
       
        return {
            name: newBlog.name, 
            description: newBlog.description,
            websiteUrl: newBlog.websiteUrl,
            createdAt: newBlog.createdAt.toISOString(),
            isMembership: newBlog.isMembership,
            id: createdBlog.insertedId
        }
    },
    
        async updatedBlogs(id: string, name: string, description: string, websiteUrl: string) {

            const result = await blogCollection.updateOne(
                {_id: new ObjectId(id)},
                {$set: {name,description,websiteUrl}}
            );

            if (result.modifiedCount > 0){
                return true
            }else{
                return false
            }



            // const blogIndex = blogs.findIndex(b => b.id === id);
            // if (blogIndex !== -1) {
            //     blogs[blogIndex] = { ...blogs[blogIndex], name, description, websiteUrl };
            //     return true; // Успешное обновление
            // } else {
            //     return false; // Блог не найден
            // }
    
    },
        async deletedBlogs(){
            return await blogCollection.deleteMany({})
           
    },
        async deletedBlogsbyId(id: string){
            const result = await blogCollection.deleteOne({_id: new ObjectId(id)})
            return result.deletedCount > 0
            
           
            


        }
}