import { Inject, Service } from "typedi";
import InjectEventDispatcher, { EventDispatcherInterface } from "../../decorator/InjectEventDispatcher";
import InjectEntityManager, { EntityManagerInterface } from "../../decorator/InjectEntityManager";
import Category from "../../entity/Category";
import User from "../../entity/User";
import AuthService from "../auth/AuthService";
import { Permission } from "../../type/auth/Permission";
import { ObjectId } from "mongodb";
import ValidatorInterface from "../validator/ValidatorInterface";
import Question from "../../entity/Question";
import QuestionSchema from "../../schema/question/QuestionSchema";
import QuestionRepository from "../../repository/QuestionRepository";
import QuestionTitleTakenError from "../../error/question/QuestionTitleTakenError";
import CategoryService from "../category/CategoryService";
import QuestionOwnershipError from "../../error/question/QuestionOwnershipError";
import QuestionNotFoundError from "../../error/question/QuestionNotFoundError";

@Service()
export default class QuestionService {

    constructor(
        @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
        @Inject() private readonly categoryService: CategoryService,
        @Inject() private readonly questionRepository: QuestionRepository,
        @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
        @Inject() private readonly authService: AuthService,
        @Inject('validator') private readonly validator: ValidatorInterface,
    ) {
    }


    /**
     * @param {string} categoryId
     * @param {CategorySchema} transfer
     * @param {User} initiator
     * @returns {Promise<Category>}
     * @throws {AuthorizationFailedError}
     * @throws {QuestionTitleTakenError}
     */
    public async createQuestion(categoryId: string, transfer: QuestionSchema, initiator: User): Promise<Question> {
        const category: Category = await this.categoryService.getCategory(categoryId);

        await this.authService.verifyAuthorization(initiator, Permission.CREATE_QUESTION);

        await this.validator.validate(transfer);

        const title = transfer.title;
        await this.verifyQuestionTitleNotExists(title);

        const question: Question = (new Question())
            .setCategory(category.getId())
            .setType(transfer.type)
            .setDifficulty(transfer.difficulty)
            .setTitle(title)
            .setChoices(transfer.choices)
            .setCreator(initiator.getId())
        ;
        await this.entityManager.save<Question>(question);

        this.eventDispatcher.dispatch('questionCreated', { question });

        return question;
    }

    /**
     * @param {string} questionId
     * @param {string} categoryId
     * @returns {Promise<Question>}
     * @throws {QuestionNotFoundError}
     */
    public async getQuestion(questionId: string, categoryId: string = undefined): Promise<Question> {
        const question: Question = await this.questionRepository.findOneById(questionId);

        if (!question || (categoryId && question.getCategory().toString() !== categoryId)) {
            throw new QuestionNotFoundError(questionId);
        }

        return question;
    }

    /**
     * @param {string} title
     * @param {ObjectId} ignoreId
     * @returns {Promise<void>}
     * @throws {CategoryNameTakenError}
     */
    public async verifyQuestionTitleNotExists(title: string, ignoreId: ObjectId = undefined): Promise<void> {
        if (await this.questionRepository.findOneByTitle(title, ignoreId)) {
            throw new QuestionTitleTakenError(title);
        }
    }

    /**
     * @param {Question} question
     * @param {User} initiator
     * @throws {QuestionOwnershipError}
     */
    public verifyQuestionOwnership(question: Question, initiator: User): void {
        if (question.getCreator().toString() !== initiator.getId().toString()) {
            throw new QuestionOwnershipError(question.getId().toString());
        }
    }
}