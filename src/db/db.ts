import mongoose from 'mongoose';
import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from 'dotenv'
dotenv.config()

export type BasePagination = {
    sortBy?: string
        sortDirection?: 'asc' | 'desc'
        pageNumber?: number
        pageSize?: number
}

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
    emailConfirmation: {
        confirmationCode: string;
        expirationDate: Date;
        isConfirmed: boolean;
    };
    refreshToken?: string | null
    
};

export type CommentatorInfoType = {
    userId: string;
    userLogin: string;
}

export type CommentType = {
    id: string;
    content: string;
    commentatorInfo: CommentatorInfoType;
    createdAt: string;
    postId: string
}

export type DeviceSessionType = {
    userId: string;
    deviceId: string;
    ip: string;
    deviceName: string;
    issuedAt: Date;
    expiresAt: Date;
    lastActiveDate: Date;
    jti: string;   

}

export type CommentResponseClientType = Omit<CommentType, 'postId'>;

export type RequestType = {
    _id?: ObjectId;
    ip: string;
    url: string;
    date: Date;
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
export const commentsCollection = client.db().collection<CommentType>('comments');
export const deviceSessionsCollection = client.db().collection<DeviceSessionType>('securitydevices');

export const requestsCollection = client.db().collection<RequestType>('requests');

