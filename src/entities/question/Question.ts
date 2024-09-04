import { Column, Entity } from 'typeorm'
import { ObjectId } from 'mongodb'
import { ArrayNotEmpty, IsEnum, IsMongoId, Length, ValidateIf, ValidateNested } from 'class-validator'
import { Authorized, Field, ObjectType } from 'type-graphql'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'
import QuestionPermission from '../../enums/question/QuestionPermission'
import Base from '../Base'
import Rating from '../rating/Rating'
import QuestionType from './QuestionType'
import QuestionDifficulty from './QuestionDifficulty'
import QuestionChoice from './QuestionChoice'

@ObjectType()
@Entity({ name: 'questions' })
export default class Question extends Base {

  @IsMongoId()
  @Column()
  @Field(_type => ObjectIdScalar)
  public categoryId: ObjectId

  @IsEnum(QuestionType)
  @Column({ type: 'enum', enum: QuestionType })
  @Field()
  public type: QuestionType

  @IsEnum(QuestionDifficulty)
  @Column({ type: 'enum', enum: QuestionDifficulty })
  @Field()
  public difficulty: QuestionDifficulty

  @Length(10, 3000)
  @Column({ unique: true })
  @Field()
  public title: string

  @Authorized(QuestionPermission.GetChoices)
  @ValidateIf(target => target.type === QuestionType.CHOICE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Column(() => QuestionChoice)
  @Field(_type => [ QuestionChoice ], { nullable: true })
  public choices?: QuestionChoice[]

  @Column(() => Rating)
  public rating?: Rating

  @Field(_type => Boolean, { name: 'isApproved', nullable: true })
  public getIsApproved(): boolean {
    return !this.ownerId
  }
}