import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Profile } from "./Profile";
import { Resume } from "./Resume";
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

  // @Field(() => String, {nullable: true})
  // @Column({nullable: true})
  // aboutMe?: string;

  @Field(()=>Resume, {nullable: true})
  @OneToOne(()=>Resume, resume => resume.user, {nullable: true})
  @JoinColumn()
  resume: Resume;

  @Field(()=>Profile, {nullable: true})
  @OneToOne(()=>Profile, profile => profile.user)
  @JoinColumn()
  profile: Profile;

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