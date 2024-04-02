import { Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from 'typeorm'
import { Exclude, Transform, Type } from 'class-transformer'
import { ObjectId } from 'mongodb'
import { IsMongoId, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator'

export class ExamAnswer {

  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value.toString())
  private question: ObjectId

  @IsNumber()
  @Min(0)
  @Column()
  private answer: number

  public setQuestion(question: ObjectId): this {
    this.question = question

    return this
  }

  public getQuestion(): ObjectId {
    return this.question
  }

  public setAnswer(answer: number): this {
    this.answer = answer

    return this
  }

  public getAnswer(): number {
    return this.answer
  }
}

@Entity({ name: 'exams' })
export default class Exam {

  @IsMongoId()
  @ObjectIdColumn()
  @Transform(({ value }: { value: ObjectId }) => value.toString())
  private id: ObjectId

  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  private category: ObjectId

  @Exclude()
  @ValidateNested({ each: true })
  @Type(() => ExamAnswer)
  @Column(() => ExamAnswer)
  private answers: ExamAnswer[]

  @IsOptional()
  @IsNumber()
  @Column()
  @UpdateDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  private completed: Date

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  private creator: ObjectId

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
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

  public setCategory(category: ObjectId): this {
    this.category = category

    return this
  }

  public getCategory(): ObjectId {
    return this.category
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
