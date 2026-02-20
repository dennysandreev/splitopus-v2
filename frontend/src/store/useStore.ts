import { create } from "zustand";

const API_BASE_URL = "";

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  payerId: string;
  createdAt: string;
}

interface ExpenseDto {
  id: string;
  amount: number;
  description: string;
  category: string;
  payer_id: string;
  created_at: string;
}

interface GetExpensesResponse {
  expenses: ExpenseDto[];
}

export interface AddExpenseInput {
  trip_id: string;
  payer_id: string;
  amount: number;
  description: string;
  category: string;
  split: Record<string, number>;
}

interface StoreState {
  currentTripId: string | null;
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  setCurrentTripId: (tripId: string | null) => void;
  fetchExpenses: (tripId: string) => Promise<void>;
  addExpense: (expense: AddExpenseInput) => Promise<void>;
}

function mapExpense(dto: ExpenseDto): Expense {
  return {
    id: dto.id,
    amount: dto.amount,
    description: dto.description,
    category: dto.category,
    payerId: dto.payer_id,
    createdAt: dto.created_at,
  };
}

export const useStore = create<StoreState>((set, get) => ({
  currentTripId: null,
  expenses: [],
  loading: false,
  error: null,
  setCurrentTripId: (tripId) => {
    set({ currentTripId: tripId });
  },
  fetchExpenses: async (tripId) => {
    set({ loading: true, error: null, currentTripId: tripId });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/expenses/${encodeURIComponent(tripId)}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch expenses: ${response.status}`);
      }
      const data = (await response.json()) as GetExpensesResponse;
      set({
        expenses: data.expenses.map(mapExpense),
        loading: false,
        error: null,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  addExpense: async (expenseInput) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseInput),
      });
      if (!response.ok) {
        throw new Error(`Failed to add expense: ${response.status}`);
      }
      const { currentTripId } = get();
      if (currentTripId && currentTripId === expenseInput.trip_id) {
        await get().fetchExpenses(currentTripId);
      } else {
        set({ loading: false, error: null });
      }
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
}));
