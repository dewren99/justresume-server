
import argon2 from 'argon2';
import prettyMilliseconds from "pretty-ms";
import { capitalizeFirstLetter } from '../utils/capitalizeFirstLetter';
import { splitOnUpperCase } from '../utils/splitOnUpperCase';
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { v4 } from "uuid";
import { COOKIE_NAME, FORGOT_PASSWORD_LINK_EXPIRATION_DATE, FORGOT_PASSWORD_PREFIX } from "../constants";
import { User } from "../entities/User";
import { MyContext } from "../types";
import sendEmail from "../utils/sendEmail";
import validateRegister from "../utils/validateRegister";
import { RegisterUserInput } from './RegisterUserInput';
import { Any } from 'typeorm';

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


@Resolver(User)
export class UserResolver {
    @Mutation(()=>Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { redis }: MyContext
    ) {
        const user = await User.findOne({
            where: {email: email}
        });

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
        @Ctx() { redis, req }: MyContext
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

        const userIdInt = parseInt(userId);
        const user = await User.findOne(userIdInt);

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

        await User.update(
            {id: userIdInt}, 
            {password: await argon2.hash(newPassword)}
        );

        await redis.del(key);
        req.session.userId = user.id; // auto-login after password change

        return { user };
    }

    @Mutation(() => UserResponse)
    async setFullName(
        @Arg('text') text: string,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const { userId } = req.session;
        let user = await User.findOne(userId);
        if(!user){
            return({
                errors: [
                    {
                        field: 'token',
                        message: 'user no longer exists'
                    }
                ]
            });
        }
        const fullName = text.split(' ');
        if(fullName.length < 2){
            return({
                errors: [
                    {
                        field: 'fullName',
                        message: 'First or last name is missing'
                    }
                ]
            });
        }
        // gets first and middle name(s), example: ['first name', 'middle', 'middle', '...', 'last name'] -> ['first name', 'middle', 'middle', '...',]
        // then join them as "first middle middle ..." and stores as user first name in DB firstName column
        const firstName = fullName.filter((_name: string, i: number, nameArr: string[]) => nameArr.length - 1 !== i?? false).join(' '); 
        const lastName = fullName[fullName.length - 1]; // get the last element as the last name
        user.firstName = firstName;
        user.lastName = lastName;
        await User.update({id: userId}, {firstName: firstName, lastName: lastName});
        return { user };
    }


    @Query(()=>User, {nullable: true})
    me(@Ctx() { req }: MyContext) {
        if(!req.session.userId){
            return null;
        }

        return User.findOne(req.session.userId);
    }

    @Query(()=>User, {nullable: true})
    getUser(
        @Arg('username', {nullable: true}) username: string, // change to or add fetch by userid
        @Ctx() { req }: MyContext
    ) {
        // const {username, id} = options;
        // if(id){
        //     return User.findOne(id);
        // }
        const userId = req.session.userId;
        if(username){
            console.log('HERE')
            return User.findOne({username: username}, {relations: ['resume', 'profile']});
        }
        if(!userId){
            return null;
        }
        return User.findOne({id: userId}, {relations: ['resume', 'profile']});
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: RegisterUserInput,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(options);
        if(errors) {
            return { errors };
        }
        const hashedPassword = await argon2.hash(options.password);
        let user;
        try{
            user = await User.create({
                ...options,
                password: hashedPassword,
            }).save();
        }
        catch (e){
            if(e.code === '23505'){
                const {detail} = e;
                const field: string = detail.slice(detail.indexOf('(') + 1, detail.indexOf(')'));
                console.log(detail, field)
                return {
                    errors: [
                        {
                            field: field,
                            message:`${capitalizeFirstLetter(splitOnUpperCase(field).join(' ').toLowerCase())} has already been taken`
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
        @Ctx() {req}: MyContext
    ): Promise<UserResponse> {
        const user = await User.findOne({
            where: [
                {username: usernameOrEmail}, 
                {email: usernameOrEmail}
            ],
        });
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