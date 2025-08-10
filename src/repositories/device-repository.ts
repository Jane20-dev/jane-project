// import { SecurityDeviceModel } from "../db/mongoDB/security-device-model";
import { DeviceSessionType } from "../db/db";
import { deviceSessionsCollection } from "../db/db";




export class DeviceRepository {
    async createDeviceSession(sessionData: DeviceSessionType): Promise<boolean>{
        try {
            await deviceSessionsCollection.insertOne(sessionData)
            return true
        } catch (error) {
            return false

            
        }
    }

   



   async getDevicesessionById(deviceId: string): Promise <any | null>{
    if(!deviceSessionsCollection){
        return null;
    }
    try {
        const deviceSession = await deviceSessionsCollection.findOne({ deviceId: deviceId });
        return deviceSession;
    } catch (error) {
        return null;
        
    }

   }



   //ТОЛЬКО ТО ЧТО БЫЛО ПРОВЕРЕНО НА ПРИНАДЛЕЖНОСТЬ!!!
    async deleteBelongSession(deviceId: string): Promise<boolean>{

        if(!deviceSessionsCollection){
            return false
        }
        try {
            const result = await deviceSessionsCollection.deleteOne({deviceId: deviceId})
            return result.deletedCount === 1;
        } catch (error) {
            return false;
            
        }

    }



    async findUserDeviceSessions(userId: string): Promise<DeviceSessionType[]> {
        try {
            // Ищем все сессии, где userId соответствует
            const sessions = await deviceSessionsCollection.find({ userId: userId }).toArray();
            return sessions;
        } catch (error) {
            console.error('Error finding user device sessions:', error);
            return []; // Возвращаем пустой массив в случае ошибки
        }
    }
    async  findDeviceSessionInDB(deviceId: string, userId: string, jti: string): Promise <DeviceSessionType | null>{
    return await deviceSessionsCollection.findOne({deviceId: deviceId, userId: userId, jti: jti})
    
    }

    async findAllActiveSessions(userId: string, deviceId: string): Promise<DeviceSessionType | null>{
        const now = new Date();
        return await deviceSessionsCollection.findOne({userId: userId, deviceId: deviceId})
    }

    async deleteDeviceSessionById( userId: string, deviceId: string,): Promise<boolean>{
        const result = await deviceSessionsCollection.deleteOne({userId: userId, deviceId: deviceId});
        return result.deletedCount === 1// Возвращаем true, если был удален 1 документ
    }

    async deleteAllSessions(userId: string, currentDeviceId: string): Promise<boolean>{
        const result = await deviceSessionsCollection.deleteMany({
            userId: userId,
            deviceId: {$ne : currentDeviceId}
            
        })
        console.log(`[deviceRepo.deleteAllSessions] Mongo удалила документов: ${result.deletedCount}`);
        return result.deletedCount > 0
    
    }
    async updateSession(deviceId: string,newExpiresAt: Date): Promise<boolean>{
        const result =  await deviceSessionsCollection.updateOne(
            {deviceId: deviceId},
            {$set: {expiresAt: newExpiresAt, lastActiveDate: new Date()}}
        );
        return result.modifiedCount === 1;
    }
    async deleteThisOldSession(jti: string): Promise<boolean>{
        try {
        const result = await deviceSessionsCollection.deleteOne({jti: jti})
        const isDeleted = result.deletedCount > 0;
        return isDeleted;

        } catch (error) {
            return false
        }
       
        
    }
   

}

export const deviceRepository = new DeviceRepository();

//другие методы delete  и тд