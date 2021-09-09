import { match, compile, parse } from 'path-to-regexp';
import * as qs from 'qs';
import { Router, UiState } from 'instantsearch.js/es/types';

export type Environment = {
  /** retrieve the current location */
  read: () => URL;
  /** write a new entry in the history */
  pushState: History['pushState'];
  /** attach an event when something else changes the page */
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
  /** set the window's title */
  setTitle?: (title?: string) => void;
};

export function patternRouter<TRouteState extends object = UiState>({
  pattern,
  title: titleFn,
  environment,
  writeDelay = 400,
}: {
  pattern: `/${string}`;
  title?: (routeState: TRouteState) => string;
  environment: Environment;
  writeDelay?: number;
}) {
  if (pattern[0] !== '/') {
    throw new Error('pattern must start with a /');
  }
  if (
    !environment ||
    typeof environment.read !== 'function' ||
    typeof environment.pushState !== 'function'
  ) {
    throw new Error(
      `environment, environment.read and environment.pushState are required. You passed: ${environment}`
    );
  }

  const toPath = compile<TRouteState>(pattern, { encode: encodeURIComponent });
  const urlToParts = match<TRouteState>(pattern, {
    decode: decodeURIComponent,
  });
  const pathParameters = parse(pattern)
    .filter(
      <TKey>(token: TKey | string): token is TKey => typeof token !== 'string'
    )
    .map((token) => token.name);

  let onPopState: (event: PopStateEvent) => void | undefined;
  let writeTimer: ReturnType<typeof setTimeout> | undefined;

  function parseURL(url: URL) {
    const res = urlToParts(url.pathname);

    if (res === false) {
      return {} as TRouteState;
    }

    const queryParams = qs.parse(url.search, {
      arrayLimit: 99,
      ignoreQueryPrefix: true,
    }) as TRouteState;

    return Object.assign({}, res.params, queryParams);
  }

  const router: Router<TRouteState> = {
    createURL(state) {
      const url = environment.read();

      url.pathname = toPath(state);

      const queryState = Object.fromEntries(
        Object.entries(state).filter(
          ([key]) => pathParameters.indexOf(key) === -1
        )
      );

      url.search = qs.stringify(queryState, { addQueryPrefix: true });

      return url.toString();
    },

    write(routeState) {
      const url = router.createURL(routeState);

      const title = titleFn?.(routeState);

      if (writeTimer) {
        clearTimeout(writeTimer);
      }

      writeTimer = setTimeout(() => {
        environment.setTitle?.(title);

        environment.pushState(routeState, title || '', url);
        writeTimer = undefined;
      }, writeDelay);
    },

    read() {
      return parseURL(environment.read());
    },

    onUpdate(callback) {
      if (!environment.events) return;

      onPopState = () => {
        if (writeTimer) {
          clearTimeout(writeTimer);
          writeTimer = undefined;
        }

        callback(this.read());
      };

      environment.events.addEventListener('popstate', onPopState);
    },

    dispose() {
      if (onPopState && environment.events) {
        environment.events.removeEventListener('popstate', onPopState);
      }

      if (writeTimer) {
        clearTimeout(writeTimer);
      }
    },
  };

  const title = titleFn?.(router.read());
  environment.setTitle?.(title);

  return router;
}

export { getWindowEnvironment } from './window-environment';
