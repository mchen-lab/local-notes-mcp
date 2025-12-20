import { AsyncLocalStorage } from "node:async_hooks";

// Async storage to track the current user for the active request
export const userContext = new AsyncLocalStorage();
