import { UnprocessableEntityException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { validationExceptionFactory } from './validation-exception.factory';

const messagesOf = (errors: ValidationError[]) =>
  (
    validationExceptionFactory(errors).getResponse() as {
      message: string[];
    }
  ).message;

describe('validationExceptionFactory', () => {
  it('answers 422 with every constraint message', () => {
    const errors: ValidationError[] = [
      {
        property: 'title',
        constraints: {
          isString: 'title must be a string',
          length: 'too short',
        },
      },
    ];

    expect(validationExceptionFactory(errors)).toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(messagesOf(errors)).toEqual(['title must be a string', 'too short']);
  });

  it('reports only the null error when a field arrives as null', () => {
    expect(
      messagesOf([
        {
          property: 'firstName',
          constraints: {
            maxLength:
              'firstName must be shorter than or equal to 80 characters',
            isString: 'firstName must be a string',
            isNonNull: 'firstName no puede ser nulo',
          },
        },
      ]),
    ).toEqual(['firstName no puede ser nulo']);
  });

  it('prefixes nested errors with their path, like Nest does', () => {
    expect(
      messagesOf([
        {
          property: 'deliverables',
          children: [
            {
              property: '0',
              children: [
                {
                  property: 'name',
                  constraints: { isString: 'name must be a string' },
                },
              ],
            },
          ],
        },
      ]),
    ).toEqual(['deliverables.0.name must be a string']);
  });
});
