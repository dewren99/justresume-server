import {Request, Response} from 'express';
import { Redis } from "ioredis";
// import { createUpvoteLoader } from './utils/createUpvoteLoader';
// import { createUserLoader } from './utils/createUserLoader';

export type MyContext = {
    res: Response;
    req: Request & { session: Express.Session};
    redis: Redis,
    // userLoader: ReturnType<typeof createUserLoader>,
    // upvoteLoader: ReturnType<typeof createUpvoteLoader>
}