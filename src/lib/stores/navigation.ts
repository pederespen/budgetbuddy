import { writable } from "svelte/store";

export const activeTabStore = writable<string>("overview");
