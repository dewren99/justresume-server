import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class Profile extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToOne(()=>User, user => user.profile)
    user: User;

    @Field(() => String, {nullable: true})
    @Column({nullable: true})
    aboutMe?: string;

    @Field(() => String, {nullable: true})
    @Column({nullable: true})
    profileImageLink?: string;

    @Field(() => String, {nullable: true})
    @Column({nullable: true})
    backgroundImageLink?: string;

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
}