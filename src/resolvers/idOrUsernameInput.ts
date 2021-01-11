import { Field, InputType } from "type-graphql";

@InputType()
export class idOrUsernameInput {
    @Field({nullable: true})
    username: string;
    @Field({nullable: true})
    id: number;
}
