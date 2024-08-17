import GetCategoryRatingMarksRequest from '../../../../src/schema/category/GetCategoryRatingMarksRequest'

export const getCategoryRatingMarks = (variables: GetCategoryRatingMarksRequest, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query CategoryRatingMarks($categoryIds: [ID!]!) {
        categoryRatingMarks(categoryIds: $categoryIds) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}