export const permissionQuery = (fields: string[] = [ 'items', 'hierarchy {regular root}' ]) => {
  return {
    query: `
      query Permission {
        permission {
          ${ fields.join('\r') }
        }
      }
  `,
  }
}