import { Context } from "hono";
import { verify } from "hono/jwt";
import { BlankInput, Next } from "hono/types";

interface CustomContext extends Context {
    set: <Key extends string>(key: Key, value: unknown) => void
}


const verifyUser = async (c: CustomContext, next: Next) => {
    const token = c.req.header('Authorization')?.split(' ')[1] as string;

    try {
        const decodedJwt = await verify(token, c.env.JWT_SECRET);
    
        console.log(decodedJwt.id);
        c.set('userId', decodedJwt.id);
        await next();
        
    } catch (error) {
        c.status(403);
        c.json({msg: 'you are not logged in'});
    }

}

export default verifyUser