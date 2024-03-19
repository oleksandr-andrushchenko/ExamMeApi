import { Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from 'typeorm'
import { Exclude, Transform } from 'class-transformer'
import { ObjectId } from 'mongodb'
import { IsMongoId, IsNumber, IsOptional, Length, Min } from 'class-validator'

@Entity({ name: 'categories' })
export default class Category {

  @IsMongoId()
  @ObjectIdColumn()
  @Transform(({ value }: { value: ObjectId }) => value.toString())
  private id: ObjectId

  @Length(3, 100)
  @Column({ unique: true, nullable: false })
  private name: string

  @Min(0)
  @Column({ default: 0, nullable: false })
  private questionCount: number = 0

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  private creator: ObjectId

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

  public setCreator(creator: ObjectId): this {
    this.creator = creator

    return this
  }

  public getCreator(): ObjectId {
    return this.creator
  }
}