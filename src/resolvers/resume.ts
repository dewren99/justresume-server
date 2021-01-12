import { Resume } from "src/entities/Resume";
import { Query, Arg } from "type-graphql";


export class ClassResolver{
    @Query(() => Resume, {nullable: true})
    resume(@Arg('userId') userId: number): Promise<Resume | undefined> {
        return Resume.findOne({ownerId: userId});
    }
}