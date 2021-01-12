import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, OneToMany } from "typeorm";
import { Field, ObjectType } from "type-graphql";
// import { Post } from "./Post";
// import { Upvote } from "./Upvote";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({unique: true})
  username!: string;

  @Field(() => String, {nullable: true})
  @Column({nullable: true})
  firstName!: string;

  @Field(() => String, {nullable: true})
  @Column({nullable: true})
  lastName!: string;

  @Field()
  @Column({unique: true})
  email!: string;

  @Column()
  password!: string;

  @Field(() => String, {nullable: true})
  @Column({nullable: true})
  aboutMe?: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  // @OneToMany(()=>Post, post=>post.creator)
  // posts: Post[];

  // @OneToMany(()=>Upvote, upvote=>upvote.user)
  // upvotes: Upvote[];
  
}