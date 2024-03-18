import { Length } from 'class-validator'

export default class CategorySchema {

  @Length(3, 100)
  public readonly name: string
}