import { Hono } from "hono";
import userRouter from "./routes/userRouter";
import blogRouter from "./routes/blogRouter";
import type { Context } from 'hono';

const app = new Hono();

const cors = (allowedOrigins = "*") => {
    return async (c: Context, next: () => Promise<void>) => {
        c.res.headers.set("Access-Control-Allow-Origin", allowedOrigins);
        c.res.headers.set(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS"
        );
        c.res.headers.set(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
        );

        if (c.req.method === "OPTIONS") {
            c.res.headers.set("Access-Control-Max-Age", "86400");
            return c.text("", 204);
        }

        await next();
    };
};

app.use("*", cors());

app.route("/api/v1/user/", userRouter);
app.route("/api/v1/blog/", blogRouter);

export default app;
