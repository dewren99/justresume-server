
import { GraphQLUpload } from 'apollo-server-express';
import { FileUpload } from 'graphql-upload';
import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { createQueryBuilder } from 'typeorm';
import { Profile } from '../entities/Profile';
import { User } from "../entities/User";
import { isAuth } from '../middleware/isAuth';
import { MyContext } from "../types";
import { s3 } from '../utils/AWS';

@Resolver(Profile)
export class ProfileResolver {
    @Mutation(() => Profile)
    @UseMiddleware(isAuth)
    async setAboutMe(
        @Arg('text') text: string,
        @Ctx() { req }: MyContext
    ): Promise<Profile | null> {
        const userId = req.session.userId;
        let user = await User.findOne(userId, {relations: ['profile']});
        if(!user){
            return null;
        }
        if(user?.profile){
            console.log('user already has profile', user.profile);
            user.profile.aboutMe = text;
            const profileId =  user.profile.id;
            Profile.update(profileId, { aboutMe: text });
            return user.profile;
        }
        return Profile.create({aboutMe: text, user}).save();
    }

    @Mutation(() => Profile)
    @UseMiddleware(isAuth)
    async setProfileImage(
        @Arg('image', ()=> GraphQLUpload) image: FileUpload,
        @Ctx() { req }: MyContext
    ): Promise<Profile | null> {
        const userId = req.session.userId;
        let user = await User.findOne(userId, {relations: ['profile']});
        if(!user){
            return null;
        }

        // S3 profile image upload start
        const { createReadStream, filename, mimetype } = await image;

        const bucketPath =  `${userId}/profileImage/`;
        const imageName = `${Date.now()}-${filename}`;

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME as string,
            Body: createReadStream(),
            ContentType: mimetype,
            Key: bucketPath + imageName,
            ACL: 'public-read'
        }
        console.log('params ContentType', params.ContentType);
        const { Location } = await s3.upload(params, (err: any, data: { Location: string; })=>{
            if(err){
                console.log(err);
                throw err;
            }
            console.log(`File uploaded successfully. ${data.Location}`);
        }).promise();
        // S3 profile image upload end

        if(user?.profile){
            console.log('user already has profile', user.profile);
            user.profile.profileImageLink = Location;
            const profileId =  user.profile.id;
            Profile.update(profileId, { profileImageLink: Location });
            return user.profile;
        }
        return Profile.create({profileImageLink: Location, user}).save();
    }

    @Query(()=>Profile, {nullable: true})
    async profile(
        @Arg('userId') userId: number
    ) {
        //https://github.com/typeorm/typeorm/issues/2707
        // const res = await Profile.findOne({
        //     relations: ['user'],
        //     where: {
        //         user: {
        //             id: userId
        //         }
        //     }
        // });
        //https://github.com/typeorm/typeorm/issues/2707
        return await Profile.findOne({
                relations: ['user'],
                where: (qb: ReturnType<typeof createQueryBuilder>) => {
                    qb.where('Profile__user.id = :id', {id: userId})
                }
            });
    }
}