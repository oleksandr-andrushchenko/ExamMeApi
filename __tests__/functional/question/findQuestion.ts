import { describe, expect, test } from '@jest/globals';
import request from "supertest";
// @ts-ignore
import { api, fixture, error, fakeId } from "../../index";
import Category from "../../../src/entity/Category";
import Question, { QuestionChoice, QuestionType } from "../../../src/entity/Question";

describe('GET /categories/:category_id/questions/:question_id', () => {
    const app = api();

    test('Not found (category)', async () => {
        const categoryId = await fakeId();
        const questionId = (await fixture<Question>(Question)).getId();
        const res = await request(app).get(`/categories/${categoryId.toString()}/questions/${questionId.toString()}`);

        expect(res.status).toEqual(404);
        expect(res.body).toMatchObject(error('NotFoundError'));
    });

    test('Not found (question)', async () => {
        const categoryId = (await fixture<Category>(Category)).getId();
        const questionId = await fakeId();
        const res = await request(app).get(`/categories/${categoryId.toString()}/questions/${questionId.toString()}`);

        expect(res.status).toEqual(404);
        expect(res.body).toMatchObject(error('NotFoundError'));
    });

    test('Found', async () => {
        const category = await fixture<Category>(Category);
        const categoryId = category.getId();
        const question = await fixture<Question>(Question, { category: category.getId() });
        const questionId = question.getId();
        const res = await request(app).get(`/categories/${categoryId.toString()}/questions/${questionId.toString()}`);

        expect(res.status).toEqual(200);
        expect(res.body).toMatchObject({
            id: questionId.toString(),
            type: question.getType(),
            difficulty: question.getDifficulty(),
            title: question.getTitle(),
        });

        if (question.getType() === QuestionType.CHOICE) {
            expect(res.body).toHaveProperty('choices');
            question.getChoices().forEach((choice: QuestionChoice, index: number) => {
                expect(res.body.choices[index]).toMatchObject({
                    title: choice.getTitle(),
                    correct: choice.isCorrect(),
                    explanation: choice.getExplanation() ?? null,
                });
            });
        }
    });
});