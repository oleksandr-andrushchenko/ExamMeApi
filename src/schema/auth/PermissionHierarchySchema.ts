import { Field, ObjectType } from 'type-graphql'
import Permission from '../../enums/Permission'

@ObjectType()
export default class PermissionHierarchySchema {

  @Field(_type => [ String ], { nullable: true })
  public [Permission.REGULAR]?: string[] = []

  @Field(_type => [ String ], { nullable: true })
  public [Permission.ROOT]?: string[] = [
    Permission.ALL,
  ]
}