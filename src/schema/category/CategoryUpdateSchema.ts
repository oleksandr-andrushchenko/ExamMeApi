import { IsNumber, IsOptional, Length, Max, Min } from 'class-validator'

export default class CategoryUpdateSchema {

  @IsOptional()
  @Length(3, 30)
  public readonly name: string

  @IsOptional()
  @Min(0)
  @Max(100)
  @IsNumber({ maxDecimalPlaces: 0 })
  public readonly requiredScore: number = 0
}