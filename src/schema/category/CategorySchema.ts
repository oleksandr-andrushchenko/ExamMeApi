import { IsNumber, Length, Max, Min } from 'class-validator'

export default class CategorySchema {

  @Length(3, 100)
  public readonly name: string

  @Min(0)
  @Max(100)
  @IsNumber({ maxDecimalPlaces: 0 })
  public readonly requiredScore: number = 0
}