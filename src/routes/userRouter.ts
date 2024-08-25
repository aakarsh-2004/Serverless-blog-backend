import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { sign } from 'hono/jwt';
import { signupInput, SignupInput, signinInput, SigninInput } from "@aakarsh-2004/medium-common";

const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string,
        JWT_SECRET: string
    }
}>();



userRouter.post('/signup', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const userData: SignupInput = await c.req.json();

    const { success } = signupInput.safeParse(userData);

    if(!success) {
        c.status(411);
        return c.json({
            msg: 'inputs are not provided correctly'
        })
    }

    try {
        const addUser = await prisma.user.create({
            data: userData
        })
    
        console.log(addUser);
    
        const token = await sign({
            email: addUser.id
        }, c.env.JWT_SECRET)
    
        return c.json(token);
    } catch (error) {
        return c.json({msg: 'error signing up'});
    }

});


userRouter.post('/signin', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const userData: SigninInput = await c.req.json();

    const { success } = signinInput.safeParse(userData);

    if(!success) {
        c.status(411);
        return c.json({
            msg: 'inputs are not provided correctly'
        })
    }

    try {
        const user = await prisma.user.findFirst({
            select: {
                id: true,
                email: true,
            },
            where: {
                email: userData.email,
                password: userData.password
            }
        })

        if(user) {
            const token = await sign({
                id: user?.id
            }, c.env.JWT_SECRET);
            
            return c.json(token);
        }

        else {
            return c.json({msg: 'user does not exist'});
        }

    } catch (error) {
        return c.json({msg: 'cannot login user'});
    }
});



userRouter.get('/getuser/:id', async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());
    const id = c.req.param('id');

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: id
            }
        })

        if(user) {
            c.status(200);
            return c.json(user)
        }
    } catch (error) {
        return c.json({
            msg: 'cannot find user for some reason'
        })
    }
})




export default userRouter;