import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from 'hono/jwt'
import { createBlogInput, updateBlogInput } from '@rithikkkkkkk/medium_commonfolder';

export const blogRouter = new Hono<{
    Bindings : {
      DATABASE_URL : string
      JWT_SECRET : string
    },
Variables : {
    userId : string
}}>();
 
blogRouter.use('/*', async (c, next) => {
    const token = await c.req.header("authorization" );
      
    const payload = await verify(token || "" ,c.env.JWT_SECRET)
    if (payload) { 
        c.set('userId', payload.id);
    await next();
    }
   
  })
  blogRouter.get('/:id', async (c) => {
	const id = c.req.param('id');
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());
	
	const post = await prisma.posts.findFirst({
		where: {
			id : parseInt(id)
		}
	});

	return c.json(post);
})
  
  blogRouter.post('/', async (c) => {
    const body = await c.req.json();
        const { success } = createBlogInput.safeParse(body);
        if(!success) {
            msg : "wrong inputs"
        }
      const prisma = new PrismaClient({
          datasourceUrl: c.env?.DATABASE_URL	,
      }).$extends(withAccelerate());
    try {
        const userId = await c.get("userId")
        const post = await prisma.posts.create({
        data : {
        title : body.title,
        content : body.content,
        authorId : parseInt(userId)
        }
        })
        return c.json(post)
      } catch(e) {
         c.json({
      msg : "err while fetching"
                })
      console.log(e)
      }
  })
  
  
  blogRouter.put('/', async (c) => {
    const body = await c.req.json();
      const { success } = updateBlogInput.safeParse(body);
    if (!success) {
        c.json({
            msg : "wrong inputs"
        })
    }
      const prisma = new PrismaClient({
      datasourceUrl:c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
      await prisma.posts.update({
       where : {
       id : body.id,
       authorId : body.userId
       },
       data : {
         title : body.title,
         content : body.content
       }
     })
    } catch(e) {
      c.json({
        msg : "err while updating"
      })
      console.log(e);
    }
  
  })
  blogRouter.get('/bulk', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());
	
	const posts = await prisma.posts.findMany({
    select : {
      content : true,
      title : true,
      id : true,
      author : {
        select : {
          name : true
        }
      }
    }
  });

	return c.json(posts);
})
