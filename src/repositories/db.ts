
import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from 'dotenv'
dotenv.config()

export type BlogType ={
   
    name: string
    description: string
    websiteUrl: string
    createdAt: Date
    isMembership: false
}

export type PostType = { 
   
    title: string; 
    shortDescription: string; 
    content: string; 
    blogId: string; 
    blogName: string; 
    createdAt: string
}

export type UserType = {
    passwordHash: string;
    _id? : ObjectId;
    id: string;
    login: string;
    email: string;
    createdAt: string;
};


// Conection URL

const url = process.env.URL;
console.log('url :', url)
if (!url){
    throw new Error('URL DOES NOT FOUND')
}
const client = new MongoClient(url)
const dbName = 'JannyProject';

export const runDb = async()=>{
    try{
        await client.connect()
        console.log('Connected successfully to server');

    }catch (e) {
        console.error(e, 'Dont connected successfully to server');
        await client.close()
    }
}

export const blogCollection = client.db().collection<BlogType>('blog');
export const postsCollection = client.db().collection<PostType>('post');
export const usersCollection = client.db().collection<UserType>('users'); 

