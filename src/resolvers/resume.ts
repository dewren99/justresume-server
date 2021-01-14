import { GraphQLUpload } from 'apollo-server-express';
import { FileUpload, } from 'graphql-upload';
import { Arg, Ctx, Mutation, Query, UseMiddleware } from "type-graphql";
import { Resume } from "../entities/Resume";
import { s3 } from "../utils/AWS";
import dotenv from 'dotenv';
import { extname } from 'path';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { User } from '../entities/User';

dotenv.config();

export class ResumeResolver{
    @Query(() => Resume, {nullable: true})
    getResumeByUserId(@Arg('userId') userId: number): Promise<Resume | undefined> {
        return Resume.findOne({ownerId: userId});
    }
    
    @Mutation(()=>Resume)
    @UseMiddleware(isAuth)
    async uploadResume(
        @Arg('resume', () => GraphQLUpload) resume: FileUpload,
        @Ctx() { req }: MyContext
    ): Promise<Resume> {
        const userId = req.session.userId;
        const { createReadStream, filename, mimetype } = await resume;

        const bucketPath =  `${userId}/resume/`;
        const resumeName = `${Date.now()}-${filename}`;

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME as string,
            Body: createReadStream(),
            ContentType: mimetype,
            Key: bucketPath + resumeName,
            ACL: 'public-read'
        }
        console.log('params ContentType', params.ContentType);
        const { Location } = await s3.upload(params, (err: any, data: { Location: any; })=>{
            if(err){
                console.log(err);
                throw err;
            }
            console.log(`File uploaded successfully. ${data.Location}`);
        }).promise();

        // const Location = await new Promise((resolve, reject) => {
        //     s3.getSignedUrl('putObject', params, (err: any, url: string) => {
        //     if (err) {
        //         console.log(err);
        //         return reject(err);
        //     }
        //     console.log('URL:', url);
        //     return resolve(url);
        //     });
        // });

        const user = await User.findOne({id: userId}, {relations: ['resume']});
        if(user?.resume){
            console.log('user has resume already', user.resume);
            user.resume.link = Location;
            const resumeId =  user.resume.id;
            Resume.update(resumeId, { link: Location });
            return user.resume;
        }
        return Resume.create({ link: Location, user}).save();
    }
}