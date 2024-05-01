import PaginatedSchema from '../pagination/PaginatedSchema'
import { ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import Exam from '../../entities/Exam'

export default class PaginatedExams extends PaginatedSchema<Exam> {

  @ValidateNested({ each: true })
  @Type(() => Exam)
  public data: Exam[]
}