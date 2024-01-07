import Joi from 'joi';

const schema: Joi.ObjectSchema = Joi.object()
    .keys({
        NODE_ENV: Joi.string().valid('development').default('development').description('Node env'),
        PORT: Joi.number().default(8080).description('Web server port number'),
    })
    .unknown();

const {value: env, error} = schema.prefs({errors: {label: 'key'}}).validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

export default env;
