import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne } from "typeorm";
import { Field, InputType, ObjectType } from "type-graphql";
import { User } from "./User";

@InputType()
export class PostInput{
  @Field()
  title: string;

  @Field()
  text: string;
}

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(()=>String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(()=>String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column({type: 'int', default: 0})
  points!: number;

  @Field()
  @Column()
  creatorId: number;

  @ManyToOne(()=>User, user=>user.posts)
  creator: User;
}