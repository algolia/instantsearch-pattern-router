import { describe, test, expect } from '@jest/globals';
import { patternRouter } from './pattern-router';
import * as qs from 'qs';

type TestState = Partial<{
  query: string;
  category: string;
  hierarchy: string[];
  menu: {
    [attribute: string]: string;
  };
}>;

describe('usage', () => {
  test('requires a pattern that starts with /', () => {
    expect(() =>
      patternRouter<TestState>({
        // @ts-expect-error
        pattern: 'search',
        environment: {
          read: () => new URL('https://example.com'),
          pushState: () => {},
        },
      })
    ).toThrowErrorMatchingInlineSnapshot(`"pattern must start with a /"`);
  });

  test('requires environment', () => {
    expect(() =>
      // @ts-expect-error
      patternRouter<TestState>({
        pattern: '/search',
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"environment, environment.read and environment.pushState are required. You passed: undefined"`
    );

    expect(() =>
      patternRouter<TestState>({
        pattern: '/search',
        // @ts-expect-error
        environment: {},
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"environment, environment.read and environment.pushState are required. You passed: [object Object]"`
    );

    expect(() =>
      patternRouter<TestState>({
        pattern: '/search',
        // @ts-expect-error
        environment: {
          read: () => new URL('https://example.com'),
        },
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"environment, environment.read and environment.pushState are required. You passed: [object Object]"`
    );

    expect(() =>
      patternRouter<TestState>({
        pattern: '/search',
        // @ts-expect-error
        environment: {
          pushState: () => {},
        },
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"environment, environment.read and environment.pushState are required. You passed: [object Object]"`
    );
  });

  test('minimal usage', () => {
    expect(() =>
      patternRouter<TestState>({
        pattern: '/search',
        environment: {
          read: () => new URL('https://example.com'),
          pushState: () => {},
        },
      })
    ).not.toThrowError();
  });
});

describe('static pattern', () => {
  let currentURL = 'https://example.com';

  const staticPatternRouter = patternRouter<TestState>({
    pattern: '/search',
    environment: {
      read: () => new URL(currentURL),
      pushState: () => {},
    },
  });

  test('remaining keys get added to query parameters', () => {
    const state: TestState = {
      query: 'hello world',
      category: 'books',
      hierarchy: ['animals', 'pets', 'dogs'],
      menu: { color: 'red' },
    };

    const url = staticPatternRouter.createURL(state);
    expect(url).toMatchInlineSnapshot(
      `"https://example.com/search?query=hello%20world&category=books&hierarchy%5B0%5D=animals&hierarchy%5B1%5D=pets&hierarchy%5B2%5D=dogs&menu%5Bcolor%5D=red"`
    );
  });

  test('remaining keys get read as string from query parameters', () => {
    const state: TestState = {
      query: 'hello world',
      category: 'books',
      hierarchy: ['animals', 'pets', 'dogs'],
      menu: { color: 'red' },
    };

    const url = staticPatternRouter.createURL(state);

    expect(url).toMatchInlineSnapshot(
      `"https://example.com/search?query=hello%20world&category=books&hierarchy%5B0%5D=animals&hierarchy%5B1%5D=pets&hierarchy%5B2%5D=dogs&menu%5Bcolor%5D=red"`
    );

    currentURL = url;

    expect(staticPatternRouter.read()).toEqual(state);
  });
});

describe('complex pattern', () => {
  let currentURL = 'https://example.com';

  const staticPatternRouter = patternRouter<TestState>({
    pattern: '/search/:hierarchy*/c/:category?',
    environment: {
      read: () => new URL(currentURL),
      pushState: () => {},
    },
  });

  test('remaining keys get added to query parameters', () => {
    const state: TestState = {
      query: 'hello world',
      category: 'books',
      hierarchy: ['animals', 'pets', 'dogs'],
      menu: { color: 'red' },
    };

    const url = staticPatternRouter.createURL(state);
    expect(url).toMatchInlineSnapshot(
      `"https://example.com/search/animals/pets/dogs/c/books?query=hello%20world&menu%5Bcolor%5D=red"`
    );
  });

  test('remaining keys get read as string from query parameters', () => {
    const state: TestState = {
      query: 'hello world',
      category: 'books',
      hierarchy: ['animals', 'pets', 'dogs'],
      menu: { color: 'red' },
    };

    const url = staticPatternRouter.createURL(state);

    expect(url).toMatchInlineSnapshot(
      `"https://example.com/search/animals/pets/dogs/c/books?query=hello%20world&menu%5Bcolor%5D=red"`
    );

    currentURL = url;

    expect(staticPatternRouter.read()).toEqual(state);
  });
});
