import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Expense {
  id: string;
  title: string;
  amount: number;
  payerId: string;
  date: string;
}

export interface Member {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  title: string;
  members: Member[];
  expenses: Expense[];
}

interface AddExpenseInput {
  groupId: string;
  title: string;
  amount: number;
  payerId: string;
}

interface StoreState {
  groups: Group[];
  addGroup: (group: Omit<Group, "id" | "expenses"> & { id?: string }) => void;
  addExpense: (input: AddExpenseInput) => void;
  seedData: () => void;
}

const TEST_USER_ID = "user_1";

const defaultMembers: Member[] = [
  { id: "user_1", name: "Вы" },
  { id: "user_2", name: "Алексей" },
];

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      groups: [],
      addGroup: (group) =>
        set((state) => ({
          groups: [
            ...state.groups,
            {
              id: group.id ?? createId("group"),
              title: group.title,
              members: group.members,
              expenses: [],
            },
          ],
        })),
      addExpense: ({ groupId, title, amount, payerId }) =>
        set((state) => ({
          groups: state.groups.map((group) => {
            if (group.id !== groupId) {
              return group;
            }

            return {
              ...group,
              expenses: [
                ...group.expenses,
                {
                  id: createId("expense"),
                  title,
                  amount,
                  payerId,
                  date: new Date().toISOString(),
                },
              ],
            };
          }),
        })),
      seedData: () => {
        if (get().groups.length > 0) {
          return;
        }

        set({
          groups: [
            {
              id: "test-trip",
              title: "Тестовая поездка",
              members: defaultMembers,
              expenses: [
                {
                  id: "exp_1",
                  title: "Супермаркет",
                  amount: 3000,
                  payerId: TEST_USER_ID,
                  date: "2026-02-18T09:00:00.000Z",
                },
                {
                  id: "exp_2",
                  title: "Такси",
                  amount: 500,
                  payerId: "user_2",
                  date: "2026-02-18T14:30:00.000Z",
                },
              ],
            },
          ],
        });
      },
    }),
    {
      name: "splitopus-storage",
    },
  ),
);

export const currentUserId = TEST_USER_ID;
