import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import verifyUser from '../middlewares/auth';
import { createBlogInput, CreateBlogInput, updateBlogInput, UpdateBlogInput } from "@aakarsh-2004/medium-common";

interface Bindings {
    DATABASE_URL: string;
    JWT_SECRET: string;
    userId: string;
}

const blogRouter = new Hono<{ 
    Bindings: Bindings, 
    Variables: { userId: string}
}>();


blogRouter.post('/', verifyUser, async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blog: CreateBlogInput = await c.req.json();
    const id = c.get('userId');

    const { success } = createBlogInput.safeParse(blog);

    if(!success) {
        c.status(411);
        return c.json({
            msg: 'inputs are not provided correctly'
        })
    }

    try {
        const res = await prisma.post.create({
            data: {
                title: blog.title,
                content: blog.content,
                published: false,
                authorId: id
            }
        })

        if(res) {
            return c.json(res);
        } else {
            return c.json({msg: 'error while creating post'});
        }

    } catch (error) {
        return c.json({msg: 'error in creating the post '+error});
    }

});


blogRouter.put('/:id', verifyUser, async (c) => {
    const body: UpdateBlogInput = await c.req.json();
    const id = c.req.param('id');

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const { success } = updateBlogInput.safeParse(body);

    if(!success) {
        c.status(411);
        return c.json({
            msg: 'inputs are not provided correctly'
        })
    }

    try {
        const existingPost = await prisma.post.findUnique({ 
            where: { 
                id: id
            }
        });
    
        if (!existingPost) {
            return c.json({ msg: 'Post not found' }, 404);
        }
    
        const blog = await prisma.post.update({
            where: { 
                id: id 
            }, 
            data: {
                title: body.title, 
                content: body.content 
            }
        });
    
        return c.json(blog);
    } catch (error) {
        return c.json({msg: 'error while updating the post'}, 500);
    }

});



blogRouter.get('/:id', async (c) => {
    const reqId = c.req.param('id');
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const post = await prisma.post.findFirst({
            select: {
                title: true,
                content: true,
                id: true,
                author: {
                    select: {
                        name: true
                    }
                }
            },
            where: {
                id: reqId
            }
        })

        if(post) {
            return c.json(post);
        }
    } catch (error) {
        return c.json({msg: 'error while fetching the particular posts'});
    }

});

blogRouter.get('/get/bulk', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const posts = await prisma.post.findMany({
            select: {
                content: true,
                title: true,
                id: true,
                author: {
                    select: {
                        name: true
                    }
                }
            }
        });
        console.log(posts);

        if(posts) {
            return c.json(posts);
        } else {
            return c.json({msg: 'cannot fetch posts'});
        }
    } catch (error) {
        return c.json({msg: 'error while fetching the posts'});
    }
})


export default blogRouter;