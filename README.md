# @algolia/instantsearch-pattern-router

A router for instantsearch which allows simple URLs to be written in the path! Compatible with:

- InstantSearch.js v3+
- Vue InstantSearch v2+
- Angular InstantSearch v2+

```js
// either via import:
import { patternRouter, windowEnvironment } from 'instantsearch-pattern-router';
// or via umd:
const { patternRouter, windowEnvironment } = window.instantsearchPatternRouter;

instantsearch({
  routing: {
    router: patternRouter({
      pattern: '/search/:hierarchy*/c/category?',
      environment: windowEnvironment,
      // optional
      windowTitle: ({ category }) => `My Site Search — ${category}`,
      writeDelay: 400,
    }),
    // required to flatten to one level
    stateMapping: myFlattenMapping,
  },
});
```

## options

### Pattern `string`

A pattern is a string of segments, more detailed examples can be found on the [path-to-regexp documentation](https://github.com/pillarjs/path-to-regexp).

### Environment `object`

Environment is an option to make this package usable in the browser, but also in other environments, like server-side rendering. The keys that are expected are:

```ts
type Environment = {
  read: () => URL;
  pushState: History['pushState'];
  events?: {
    addEventListener(
      type: 'popstate',
      listener: (this: Window, ev: PopStateEvent) => any
    ): void;
    removeEventListener(
      type: 'popstate',
      listener: (this: Window, ev: PopStateEvent) => any
    ): void;
  };
  setTitle?: (title?: string) => void;
};
```

### title `function` (optional)

A function that retrieves the current RouteState object

### writeDelay `number` (optional)

The number of ms to debounce writing to the URL to maintain performance (writing on every keystroke slows down a site considerably). Default is 500ms.