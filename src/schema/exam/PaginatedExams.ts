import PaginatedSchema from '../pagination/PaginatedSchema'
import { ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import Exam from '../../entities/Exam'
import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export default class PaginatedExams extends PaginatedSchema<Exam> {

  @ValidateNested({ each: true })
  @Type(() => Exam)
  @Field(_type => [ Exam ])
  public data: Exam[]
}