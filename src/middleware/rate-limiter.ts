const request: {[key: string]: {count: number; firstRequestTime : number}} = {};
export const ipLimiter = (limit: number, timeInSeconds: number) =>{
    return (req: any, res: any, next: any) =>{
        const key = process.env.NODE_ENV === 'test' 
            ? `test-ip:${req.path}` 
            : `${req.ip}:${req.path}`;
        
        const now = Date.now();
        const tenSecondsInMs = timeInSeconds * 1000;
        
        if (!request[key] || now - request[key].firstRequestTime > tenSecondsInMs) {
            request[key] = {
                count: 0,
                firstRequestTime: now,
            };
        }
        
        if (request[key].count >= limit) {
            return res.sendStatus(429);
        }
        
        request[key].count++;
        next();
    };
};

