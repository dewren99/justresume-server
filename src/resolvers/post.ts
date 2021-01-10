import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { Arg, Ctx, Field, FieldResolver, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { Post, PostInput } from "../entities/Post";
import { getConnection } from 'typeorm';
import { User } from "src/entities/User";
import { Upvote } from "src/entities/Upvote";

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
    @FieldResolver(() => User)
    creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
        return userLoader.load(post.creatorId);
    }

    @FieldResolver(()=>String)
    textSnippet(
        @Root() root: Post
    ){
        return root.text.slice(0, 50);
    }

    @Query(() => PaginatedPosts)
    async posts(
        @Arg('limit', ()=>Int) limit: number,
        @Arg('cursor', ()=>String, {nullable: true}) cursor: string | null,
    ): Promise<PaginatedPosts> {
        const protectedLimit = Math.min(50, limit);
        const protectedLimitPlusOne =protectedLimit + 1;

        const replacements: any[] = [protectedLimitPlusOne];

        if (cursor) {
          replacements.push(new Date(parseInt(cursor)));
        }

        const posts = await getConnection().query(
        `
            select p.*
            from post p
            ${cursor ? `where p."createdAt" < $2` : ""}
            order by p."createdAt" DESC
            limit $1
        `,
        replacements
        );

        // const queryBuilder = getConnection()
        //     .getRepository(Post)
        //     .createQueryBuilder("post")
        //     .innerJoinAndSelect(
        //         "post.creator",
        //         "user",
        //         'user.id = post."CreatorId"'
        //     )
        //     .orderBy("post.createdAt", "DESC")
        //     .take(protectedLimit) // limit is default but take is recommended for complex queries
        // if(cursor){
        //     queryBuilder.where('post."CreatedAt" < :cursor', {cursor: new Date( parseInt(cursor) )});
        // }
        // const posts = await queryBuilder.getMany();

        return { 
            posts: posts.slice(0, protectedLimit), 
            hasMore: posts.length === protectedLimitPlusOne 
        };
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

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
      @Arg("postId", () => Int) postId: number,
      @Arg("value", () => Int) value: number,
      @Ctx() { req }: MyContext
    ) {
      const isUpvote = value !== -1;
      const realValue = isUpvote ? 1 : -1;
      const { userId } = req.session;
  
      const upvote = await Upvote.findOne({ where: { postId, userId } });
  
      // the user has voted on the post before
      // and they are changing their vote
      if (upvote && upvote.value !== realValue) {
        await getConnection().transaction(async (tm) => {
          await tm.query(
            `
                update upvote
                set value = $1
                where "postId" = $2 and "userId" = $3
            `,
            [realValue, postId, userId]
          );
  
          await tm.query(
            `
                update post
                set points = points + $1
                where id = $2
            `,
            [2 * realValue, postId]
          );
        });
      } 
      else if (!upvote) {
        // has never voted before
        await getConnection().transaction(async (tm) => {
        await tm.query(
            `
                insert into upvote ("userId", "postId", value)
                values ($1, $2, $3)
            `,
            [userId, postId, realValue]
        );

        await tm.query(
            `
                update post
                set points = points + $1
                where id = $2
            `,
            [realValue, postId]
        );
        });
      }
      return true;
    }
}