import Permission from '../../enums/Permission'

type PermissionHierarchy = {
  [value in Permission]: Permission[];
};

export default PermissionHierarchy