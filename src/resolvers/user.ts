
import { User } from "../entities/User";
import { MyContext } from "../types";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from 'argon2';
import { EntityManager } from '@mikro-orm/postgresql';
import { COOKIE_NAME, FORGOT_PASSWORD_LINK_EXPIRATION_DATE, FORGOT_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import validateRegister from "../utils/validateRegister";
import sendEmail from "../utils/sendEmail";
import { v4 } from "uuid";
import prettyMilliseconds from "pretty-ms";

@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[]

    @Field(() => User, {nullable: true})
    user?: User
}

@Resolver()
export class UserResolver {
    @Mutation(()=>Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { em, redis }: MyContext
    ) {
        const user = await em.findOne(User, { email: email });
        if(!user){
            return true;
        }

        const token = v4();
        await redis.set(FORGOT_PASSWORD_PREFIX + token, user.id, 'ex', FORGOT_PASSWORD_LINK_EXPIRATION_DATE)
        const resetPasswordLink = `<a href="http://localhost:3000/change-password/${token}">Reset password (valid for ${prettyMilliseconds(FORGOT_PASSWORD_LINK_EXPIRATION_DATE, {verbose: true})})</a>`;
        sendEmail(email, resetPasswordLink);
        return true;
    }

    @Mutation(()=>UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() { em, redis, req }: MyContext
    ): Promise<UserResponse> {
        if(newPassword.length <= 2) {
            return {
                errors: [
                    {
                        field: 'newPassword',
                        message: 'invalid password length'
                    }
                ]
            };
        }

        const key = FORGOT_PASSWORD_PREFIX + token;
        const userId = await redis.get(key);
        if(!userId){
            return {
                errors: [
                    {
                        field: 'token',
                        message: 'token expired'
                    }
                ]
            };
        }

        const user = await em.findOne(User, {id: parseInt(userId)});

        if(!user){
            return {
                errors: [
                    {
                        field: 'token',
                        message: 'user no longer exists'
                    }
                ]
            };
        }

        user.password = await argon2.hash(newPassword);
        em.persistAndFlush(user);

        await redis.del(key);
        req.session.userId = user.id; // auto-login after password change

        return { user };
    }

    @Query(()=>User, {nullable: true})
    async me(
        @Ctx() { req, em }: MyContext
    ) {
        if(!req.session.userId){
            return null;
        }

        const user = await em.findOne(User, { id: req.session.userId });
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() {em, req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(options);
        if(errors) {
            return { errors };
        }
        const hashedPassword = await argon2.hash(options.password);
        let user;
        try{
            const result = await (em as EntityManager)
                .createQueryBuilder(User)
                .getKnexQuery()
                .insert({
                    username: options.username, 
                    password: hashedPassword,
                    email: options.email,
                    created_at: new Date(),
                    updated_at: new Date(),
                })
                .returning('*');
            user = result[0];
            await em.persistAndFlush(user);
        }
        catch (e){
            if(e.code === '23505'){
                return {
                    errors: [
                        {
                            field:'usernameOrEmail',
                            message:'username has already been taken'
                        }
                    ],
                };
            }
            console.log('error creating user:', e.message);
        }

        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password') password: string,
        @Ctx() {em, req}: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(
            User, 
            { $or: [
                {username: usernameOrEmail}, {email: usernameOrEmail}
            ]}
        );
        if(!user){
            return {
                errors: [
                    {
                        field: 'username',
                        message: 'that username does not exist'
                    }
                ]
            };
        }
        const valid = await argon2.verify(user.password, password);
        if(!valid){
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'incorrect password'
                    }
                ]
            };
        }

        req.session.userId = user.id;

        return { user };
    }

    @Mutation(()=> Boolean)
    logout(
        @Ctx() { req, res }: MyContext
    ) {
        return new Promise(resolve => req.session.destroy(
            (err: Error) => {
                res.clearCookie(COOKIE_NAME);
                if(err) {
                    console.log(err);
                    resolve(false);
                    return;
                }
                resolve(true);
            }
        ));
    }
}