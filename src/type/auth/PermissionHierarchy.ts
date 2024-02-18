import Permission from "../../enum/auth/Permission";

type PermissionHierarchy = {
    [value in Permission]: Permission[];
};

export default PermissionHierarchy;