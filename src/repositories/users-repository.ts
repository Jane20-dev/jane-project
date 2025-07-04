import { v4 as uuidv4 } from 'uuid';
import {runDb} from './db'
import { usersCollection, UserType } from './db';
import { promises } from 'dns';

const startServer = async () =>{
    await runDb()
}
startServer()

export const usersRepository = {
    // Создание пользователя (POST /users)
    async createUser(user: UserType): Promise<UserType> {
      // const newUser: UserType =  {
      //     id: uuidv4(),
      //     login,
      //     email,
      //     passwordHash,
      //     createdAt: new Date().toISOString(),
      // };
      console.log('Inserting user:', user);
      await usersCollection.insertOne(user);
      return user;
    },

    async findUserByLogin(login: string): Promise<UserType | null> {
        return usersCollection.findOne({ login });
    },
    
    async findUserByEmail(email: string): Promise<UserType | null> {
        return usersCollection.findOne({ email });
    },
    async findUserByLoginOrEmail(loginOrEmail: string): Promise<UserType | null> {
        return usersCollection.findOne({
          $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
        });
    },
    async deletedUserssbyId(id: string){
            const result = await usersCollection.deleteOne({id:id})
            return result.deletedCount > 0
    },

    async findUserByConfrimationCode(confirmationCode: string): Promise<UserType | null>{
      return usersCollection.findOne({confirmationCode})
    },

    async updateEmailStatus (userId: string, isConfirmed: boolean ): Promise<boolean>{
      const result =  await usersCollection.updateOne(
        {id: userId},
        {$set: {'emailConfirmation.isConfirmed': isConfirmed}}
        
      );
      return result.modifiedCount === 1;
    },

    async updateConfirmationCode(
      userId: string,
      newCode: string,
      newExpiration: Date
    ): Promise<boolean>{
      const result = await usersCollection.updateOne(
        {id: userId},
        {

          $set: {
                "emailConfirmation.confirmationCode": newCode, // ОБНОВЛЕНИЕ: Устанавливаем новый код
                    "emailConfirmation.expirationDate": newExpiration // ОБНОВЛЕНИЕ: Устанавливаем новый срок действия
          }
        }
      );
      return result.modifiedCount === 1;
    },

    async findUsersList(query: {
        searchLoginTerm?: string;
        searchEmailTerm?: string;
        sortBy?: string;
        sortDirection?: 'asc' | 'desc';
        pageNumber?: number;
        pageSize?: number;
    }) {
        const {
          searchLoginTerm,
          searchEmailTerm,
          sortBy = 'createdAt',
          sortDirection = 'desc',
          pageNumber =  1,
          pageSize = 10,
        } = query;

        const filter: any = {}

        if (searchLoginTerm || searchEmailTerm) {
          filter.$or = [];
          if (searchLoginTerm) {
            filter.$or.push({ login: { $regex: searchLoginTerm, $options: 'i' } });
          }
          if (searchEmailTerm) {
            filter.$or.push({ email: { $regex: searchEmailTerm.replace(/\./g, '\\.'), $options: 'i' } });
          }
        }
        
        const sortOptions: any = {};
        if(sortBy){
          sortOptions[sortBy] = sortDirection === 'desc' ? -1: 1;
        }

        const users = await usersCollection
          .find(filter)
          .sort(sortOptions)
          .skip((pageNumber - 1) * pageSize)
          .limit(pageSize)
          .toArray();

        const totalCount = await usersCollection.countDocuments(filter);

          return {
            pagesCount: Math.ceil(totalCount / pageSize),
            page: pageNumber,
            pageSize: pageSize,
            totalCount,
            items: users.map((user) => ({
                id: user.id,
                login: user.login,
                email: user.email,
                createdAt: user.createdAt,
            })),
          };
    },
};