import { Column, Entity } from 'typeorm'
import { ObjectId } from 'mongodb'
import { ArrayNotEmpty, IsEnum, IsMongoId, Length, ValidateIf, ValidateNested } from 'class-validator'
import { Authorized, Field, ObjectType } from 'type-graphql'
import { ObjectIdScalar } from '../scalars/ObjectIdScalar'
import QuestionPermission from '../enums/question/QuestionPermission'
import Base from './Base'
import Rating from './Rating'
import QuestionType from './question/QuestionType'
import QuestionDifficulty from './question/QuestionDifficulty'
import QuestionChoice from './question/QuestionChoice'
import QuestionAnswer from './question/QuestionAnswer'

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

  @Authorized(QuestionPermission.READ_CHOICES)
  @ValidateIf(question => question.type === QuestionType.CHOICE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Column(() => QuestionChoice)
  @Field(_type => [ QuestionChoice ], { nullable: true })
  public choices?: QuestionChoice[]

  @Authorized(QuestionPermission.READ_ANSWERS)
  @ValidateIf(question => question.type === QuestionType.TYPE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Column(() => QuestionAnswer)
  @Field(_type => [ QuestionAnswer ], { nullable: true })
  public answers?: QuestionAnswer[]

  @Column(() => Rating)
  @Field(_type => Rating, { nullable: true })
  public rating?: Rating
}