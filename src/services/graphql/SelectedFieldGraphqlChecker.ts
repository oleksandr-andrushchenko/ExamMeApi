import { GraphQLResolveInfo } from 'graphql/type'
import { Service } from 'typedi'
import { SelectionNode } from 'graphql/language/ast'

@Service()
export default class SelectedFieldGraphqlChecker {

  /**
   * Example operation:
   * query PaginatedCategories($size: Int) {
   *   paginatedCategories(size: $size) {
   *     data {
   *       id
   *     }
   *     meta {
   *       nextCursor
   *       prevCursor
   *     }
   *   }
   * }
   *
   * Example use:
   * checkSelectedField(info, 'PaginatedCategories.paginatedCategories.meta.nextCursor') => TRUE
   * checkSelectedField(info, 'paginatedCategories.meta') => TRUE
   * checkSelectedField(info, 'paginatedCategories.any') => FALSE
   * checkSelectedField(info, 'any') => FALSE
   *
   * @param {GraphQLResolveInfo} info
   * @param {string} path
   * @returns {boolean}
   */
  public checkSelectedField(info: GraphQLResolveInfo, path: string): boolean {
    for (const _path of this.iteratePaths(info.operation.selectionSet.selections)) {
      if ([ ...[ info.operation.name.value ], ..._path ].join('.').includes(path)) {
        return true
      }
    }

    return false
  }

  private* iteratePaths(selections: ReadonlyArray<SelectionNode>): Generator<any, [], any> {
    if (selections.length == 0) return yield []

    for (const selection of selections) {
      if (selection['selectionSet'] && selection['selectionSet']['selections']) {
        for (const path of this.iteratePaths(selection['selectionSet']['selections'])) {
          yield [ selection['name']['value'], ...path ]
        }
      } else {
        yield [ selection['name']['value'] ]
      }
    }
  }

  private _checkSelectedField(info: GraphQLResolveInfo, path: string): boolean {
    return this.checkSelections(info.operation.selectionSet.selections, path.split('.'))
  }

  private checkSelections(selections: ReadonlyArray<SelectionNode>, path: string[]): boolean {
    let peace = path.shift()

    for (const selection of selections) {
      if (selection['name']['value'] === peace) {
        if (path.length > 0) {
          return this.checkSelections(selection['selectionSet']['selections'], path)
        }

        return true
      }
    }

    return false
  }
}