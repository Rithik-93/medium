import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from 'hono/jwt'
import { signinInput, signupInput } from "@rithikkkkkkk/medium_commonfolder";

export const userRouter = new Hono<{
    Bindings : {
      DATABASE_URL : string
      JWT_SECRET : string
    }}>();

userRouter.post('/signup', async (c) => {
    const body = await c.req.json();
    const { success } = signupInput.safeParse(body);
    if (!success) {
        c.status(411)
        return c.json({
            msg : "wrong ifhnputs"
        })
        
    }
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	
    console.log("reached")
	try {
		const user = await prisma.user.create({
			data: {
				username: body.username,
				password: body.password
			}
		});
		const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
		return c.json( jwt );
	} catch(e) {
    console.log(e)
		c.status(403);
		return c.json({ error: "error while signing up" });
	}
})

userRouter.post('/signin', async (c) => {
    const body = await c.req.json();
    const { success } = signinInput.safeParse(body);
    if (!success) {
        c.json({
            msg : "wrong inputs"
        })
    }
  const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());
  
  
    
    const user = await prisma.user.findUnique({
           where : {
               username : body.username
                    }
    });

    if (!user) {
      c.status(403);
      return c.json({error : "user not found"});
    }

    const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
    return c.json(jwt); 
})