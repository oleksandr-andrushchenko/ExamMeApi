import { Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from 'typeorm'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { ObjectId } from 'mongodb'
import { IsDate, IsMongoId, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator'

export class ExamQuestion {

  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value.toString())
  private question: ObjectId

  @IsOptional()
  @IsNumber()
  @Column({nullable:false})
  public choice?: number

  @IsOptional()
  @IsString()
  @Column({nullable:false})
  public answer?: string

  public setQuestion(question: ObjectId): this {
    this.question = question

    return this
  }

  public getQuestion(): ObjectId {
    return this.question
  }

  public setChoice(choice: number | undefined): this {
    this.choice = choice

    return this
  }

  public getChoice(): number {
    return this.choice
  }

  public setAnswer(answer: string | undefined): this {
    this.answer = answer

    return this
  }

  public getAnswer(): string {
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
  @Type(() => ExamQuestion)
  @Column(() => ExamQuestion)
  private questions: ExamQuestion[]

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ default: 0, nullable: false })
  private questionNumber: number = 0

  @Exclude()
  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ default: 0, nullable: false })
  private correctCount: number = 0

  @IsOptional()
  @IsDate()
  @Column()
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

  public setQuestions(questions: ExamQuestion[]): this {
    this.questions = questions

    return this
  }

  public getQuestions(): ExamQuestion[] {
    return this.questions
  }

  @Expose({ name: 'questionsCount' })
  public getQuestionsCount(): number {
    return this.questions?.length || 0
  }

  @Expose({ name: 'answeredCount' })
  public getQuestionsAnsweredCount(): number {
    return (this?.questions || [])
      .filter((question: ExamQuestion): boolean => typeof question.choice === 'number' || typeof question.answer === 'string')
      .length
  }

  public getCategory(): ObjectId {
    return this.category
  }

  public setQuestionNumber(questionNumber: number): this {
    this.questionNumber = questionNumber

    return this
  }

  public getQuestionNumber(): number {
    return this.questionNumber
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

  public setCorrectCount(correctCount: number): this {
    this.correctCount = correctCount

    return this
  }

  public getCorrectCount(): number {
    return this.correctCount
  }

  public setCompleted(completed: Date): this {
    this.completed = completed

    return this
  }

  public getCompleted(): Date {
    return this.completed
  }
}
