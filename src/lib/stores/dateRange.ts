import { writable } from "svelte/store";

export type DateRangePreset =
  | "all"
  | "last7days"
  | "last30days"
  | "last3months"
  | "last6months"
  | "thisMonth"
  | "lastMonth"
  | "custom";

export interface DateRangeState {
  preset: DateRangePreset;
  startDate: Date | null;
  endDate: Date | null;
}

function createDateRangeStore() {
  const initialState: DateRangeState = {
    preset: "all",
    startDate: null,
    endDate: null,
  };

  const { subscribe, set, update } = writable<DateRangeState>(initialState);

  return {
    subscribe,
    set,
    update,

    setPreset: (preset: DateRangePreset) => {
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch (preset) {
        case "last7days":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          endDate = now;
          break;

        case "last30days":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          endDate = now;
          break;

        case "last3months":
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          endDate = now;
          break;

        case "last6months":
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 6);
          endDate = now;
          break;

        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;

        case "lastMonth":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;

        case "all":
        case "custom":
        default:
          startDate = null;
          endDate = null;
          break;
      }

      set({ preset, startDate, endDate });
    },

    setCustomRange: (startDate: Date | null, endDate: Date | null) => {
      set({ preset: "custom", startDate, endDate });
    },

    reset: () => {
      set(initialState);
    },
  };
}

export const dateRangeStore = createDateRangeStore();
