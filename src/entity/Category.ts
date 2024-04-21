import { Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from 'typeorm'
import { Exclude, Transform } from 'class-transformer'
import { ObjectId } from 'mongodb'
import { IsMongoId, IsNumber, IsOptional, Length, Max, Min } from 'class-validator'
import { Field, Int, ID, ObjectType } from 'type-graphql'

@ObjectType()
@Entity({ name: 'categories' })
export default class Category {

  @IsMongoId()
  @ObjectIdColumn()
  @Transform(({ value }: { value: ObjectId }) => value.toString())
  @Field(_type => ID)
  private id: ObjectId

  @Length(3, 100)
  @Column({ unique: true, nullable: false })
  @Field()
  private name: string

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ default: 0, nullable: false })
  @Field(_type => Int)
  private questionCount: number = 0

  @Min(0)
  @Max(100)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ nullable: false })
  @Field(_type => Int)
  private requiredScore: number = 0

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ nullable: false })
  @Field(_type => Int)
  private voters: number = 0

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Column({ nullable: false })
  @Field(_type => Int)
  private rating: number = 0

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  private creator: ObjectId

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  @Field(_type => ID)
  private owner: ObjectId

  @IsNumber()
  @Column()
  @CreateDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  private created: Date

  @IsOptional()
  @IsNumber()
  @Column()
  @UpdateDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  private updated: Date

  @Exclude()
  @IsOptional()
  @IsNumber()
  @Column()
  @DeleteDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  private deleted: Date

  public getId(): ObjectId {
    return this.id
  }

  public setName(name: string): this {
    this.name = name

    return this
  }

  public getName(): string {
    return this.name
  }

  public setQuestionCount(count: number): this {
    this.questionCount = count

    return this
  }

  public getQuestionCount(): number {
    return this.questionCount
  }

  public setRequiredScore(requiredScore: number): this {
    this.requiredScore = requiredScore

    return this
  }

  public getRequiredScore(): number {
    return this.requiredScore
  }

  public setCreator(creator: ObjectId): this {
    this.creator = creator

    return this
  }

  public getCreator(): ObjectId {
    return this.creator
  }

  public setOwner(owner: ObjectId): this {
    this.owner = owner

    return this
  }

  public getOwner(): ObjectId {
    return this.owner
  }
}