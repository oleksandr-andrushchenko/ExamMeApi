enum Permission {
  REGULAR = 'regular',
  ROOT = 'root',
  CREATE_USER = 'createUser',
  CREATE_CATEGORY = 'createCategory',
  REPLACE_CATEGORY = 'replaceCategory',
  UPDATE_CATEGORY = 'updateCategory',
  DELETE_CATEGORY = 'deleteCategory',
  CREATE_QUESTION = 'createQuestion',
  REPLACE_QUESTION = 'replaceQuestion',
  UPDATE_QUESTION = 'updateQuestion',
  DELETE_QUESTION = 'deleteQuestion',
  GET_EXAM = 'getExam',
  CREATE_EXAM = 'createExam',
  DELETE_EXAM = 'deleteExam',
  ALL = '*',
}

export default Permission