import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Post, PostInput } from "../entities/Post";


@Resolver()
export class PostResolver {
    @Query(() => [Post])
    posts(): Promise<Post[]> {
        return Post.find();
    }

    @Query(() => Post, {nullable: true})
    post(@Arg('id') id: number): Promise<Post | undefined> {
        return Post.findOne(id);
    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg('input') input: PostInput,
        @Ctx() { req }: MyContext
        ): Promise<Post> {
        return Post.create({
            ...input,
            creatorId: req.session.userId,
        }).save();
    }

    @Mutation(() => Post, {nullable: true})
    async updatePost( @Arg('id') id: number, @Arg('title', {nullable: true}) title: string): Promise<Post | undefined> {
        const post = await Post.findOne(id);
        if(!post){
            return undefined;
        }
        if(typeof title !== 'undefined'){
            Post.update({id}, {title});
        }
        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(@Arg('id') id: number): Promise<boolean> {
        try{
            await Post.delete(id);
        }
        catch(e){
            return false;
        }
        return true;
    }
}