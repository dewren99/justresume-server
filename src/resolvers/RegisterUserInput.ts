import { Field, InputType } from "type-graphql";

@InputType()
export class RegisterUserInput {
    @Field()
    username: string;
    @Field()
    firstName: string;
    @Field()
    lastName: string;
    @Field()
    password: string;
    @Field()
    email: string;
}
