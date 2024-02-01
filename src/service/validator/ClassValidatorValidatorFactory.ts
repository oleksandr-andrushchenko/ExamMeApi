import { Service } from "typedi";
import ClassValidatorValidator from "./ClassValidatorValidator";

@Service()
export class ClassValidatorValidatorFactory {

    public create(): ClassValidatorValidator {
        return new ClassValidatorValidator();
    }
}