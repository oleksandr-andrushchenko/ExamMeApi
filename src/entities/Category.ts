import { Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from 'typeorm'
import { Exclude, Transform } from 'class-transformer'
import { ObjectId } from 'mongodb'
import { IsMongoId, IsNumber, IsOptional, Length, Max, Min } from 'class-validator'
import { Field, ID, Int, ObjectType } from 'type-graphql'

@ObjectType()
@Entity({ name: 'categories' })
export default class Category {

  @IsMongoId()
  @ObjectIdColumn()
  @Transform(({ value }: { value: ObjectId }) => value.toString())
  @Field(_type => ID)
  public readonly id: ObjectId

  @Length(3, 100)
  @Column({ unique: true })
  @Field()
  public name: string

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ default: 0 })
  @Field(_type => Int)
  public questionCount: number = 0

  @Min(0)
  @Max(100)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ nullable: true, default: 0 })
  @Field(_type => Int, { nullable: true })
  public requiredScore?: number = 0

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ nullable: true, default: 0 })
  @Field(_type => Int, { nullable: true })
  public voters?: number = 0

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Column({ nullable: true, default: 0 })
  @Field(_type => Int, { nullable: true })
  public rating?: number = 0

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  public creator: ObjectId

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  @Field(_type => ID)
  public owner: ObjectId

  @IsNumber()
  @Column()
  @CreateDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  public created: Date

  @IsOptional()
  @IsNumber()
  @Column()
  @UpdateDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  public updated: Date

  @Exclude()
  @IsOptional()
  @IsNumber()
  @Column()
  @DeleteDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  public deleted: Date
}