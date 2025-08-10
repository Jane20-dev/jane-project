import {Request, Response, Router} from 'express'
import { usersRepository } from '../repositories/users-repository';
import { userService} from '../services/auth-service';
import { AuthService } from '../services/auth-service';
import { authenticateToken } from './auth';
import { deviceRepository } from '../repositories/device-repository';
import { DeviceNotfoundError, DeviceNotOwnedError } from '../errors';




export const securityRoute = Router();

securityRoute.get('/devices', authenticateToken,  async (req: Request, res: Response) =>{
   
    try {
        const sessions = await userService.getUserActiveSessions(req.userPayload!.userId)
        if(!sessions){
            return res.status(200).json([])
        }

        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).send('Internal Server Error while fetching sessions')
        
    }

    return true;

});




securityRoute.delete('/devices/:deviceId',authenticateToken, async(req:Request, res: Response)=>{
    const deviceIdToDelete = req.params.deviceId;
    const userId = req.userPayload?.userId;

    if(!userId){
        return res.status(401).send({message: 'User ID is missing'})
    }
    if(!deviceIdToDelete){
        return res.status(400).send({message: 'Device ID is required in URL parameter'})
    }
 

    try {

        const isdDeleted = await userService.deletedDevicebyId( userId, deviceIdToDelete)
        if(isdDeleted){
            return res.status(204).send()

        }else{
    
        }



  
    } catch (error) {
        if(error instanceof DeviceNotfoundError){
            return res.status(404).send({message: error.message})
        }
        if(error instanceof DeviceNotOwnedError){
            return res.status(403).send({message: error.message})
        }

        console.error('Error deleting session:', error)
        res.status(500).send('Error deleting this session');
        
    }
    return true

})








securityRoute.delete('/devices', authenticateToken, async (req: Request, res: Response) =>{


    console.log(`[DELETE /devices] Запрос на удаление. userId из токена: ${req.userPayload?.userId}, currentDeviceId из токена: ${req.userPayload?.deviceId}`);


    if(!req.userPayload){
        return res.status(401).send({message: 'User payload missing'})

    }

        const userId = req.userPayload?.userId;
        const currentDeviceId = req.userPayload?.deviceId;


    try {
        const deleteSessions = await userService.deleteAllSesions(userId, currentDeviceId)

console.log(`[DELETE /devices] userService.deleteAllSesions вернул: ${deleteSessions}`);
    

        if(!deleteSessions){
            return res.status(204).send();

        }else{
            return res.status(204).send();
        }
    } catch (error) {
        
    }
    return true;
})


