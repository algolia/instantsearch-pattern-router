import { Environment } from "./pattern-router";

export const getWindowEnvironment = (): Environment => ({
  read: () => new URL(window.location.href),
  pushState: window.history.pushState,
  events: window,
  setTitle: (title?: string): void => {
    if (title) {
      window.document.title = title;
    }
  },
});
