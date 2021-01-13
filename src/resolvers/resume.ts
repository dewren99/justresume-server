import { GraphQLUpload } from 'apollo-server-express';
import { FileUpload, } from 'graphql-upload';
import { Arg, Ctx, Mutation, Query, UseMiddleware } from "type-graphql";
import { Resume } from "../entities/Resume";
import { s3 } from "../utils/AWS";
import dotenv from 'dotenv';
import { extname } from 'path';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';

dotenv.config();

export class ResumeResolver{
    @Query(() => Resume, {nullable: true})
    getResumeByUserId(@Arg('userId') userId: number): Promise<Resume | undefined> {
        return Resume.findOne({ownerId: userId});
    }
    
    @Mutation(()=>String)
    @UseMiddleware(isAuth)
    async uploadResume(
        @Arg('resume', () => GraphQLUpload) resume: FileUpload,
        @Ctx() { req }: MyContext
    ): Promise<string> {
        const { createReadStream, filename, mimetype } = await resume;
        const userId = req.session.userId;
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME as string,
            Body: createReadStream(),
            ContentType: mimetype,
            Key: `${userId}/resume/${filename}`,
        }
        console.log('resume', resume);
        const uploadRes = await s3.upload(params, (err: any, data: { Location: any; })=>{
            if(err){
                console.log(err);
                throw err;
            }
            console.log(`File uploaded successfully. ${data.Location}`);
        }).promise();
        console.log('uploadRes', uploadRes);
        return uploadRes.Location;
    }
}