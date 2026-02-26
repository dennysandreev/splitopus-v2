import WebApp from "@twa-dev/sdk";
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

export interface Note {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

interface NoteDto {
  id: string;
  text: string;
  author?: string;
  author_name?: string;
  created_at?: string;
}

interface GetNotesResponse {
  notes: NoteDto[];
}

export interface StatsCategory {
  category: string;
  amount: number;
}

export interface Stats {
  my: StatsCategory[];
  overall: StatsCategory[];
}

interface StatsCategoryDto {
  category?: string;
  name?: string;
  amount: number;
}

interface GetStatsResponse {
  my?: StatsCategoryDto[];
  mine?: StatsCategoryDto[];
  overall?: StatsCategoryDto[];
  total?: StatsCategoryDto[];
}

export interface DebtTransaction {
  from: string;
  to: string;
  amount: number;
}

interface DebtTransactionDto {
  from: string;
  to: string;
  amount: number;
}

interface GetDebtsResponse {
  debts: DebtTransactionDto[];
}

export interface AddExpenseInput {
  trip_id: string;
  payer_id: string;
  amount: number;
  description: string;
  category: string;
  split: Record<string, number>;
}

interface AppUser {
  id: string;
  firstName: string;
}

export interface Trip {
  id: string;
  name: string;
  code: string;
  currency: string;
  rate: number;
}

export interface TripMember {
  id: string;
  name: string;
}

interface TripDto {
  id: string;
  name: string;
  code: string;
  currency: string;
  rate: number;
  creator_id: string;
  created_at: string;
}

interface GetTripsResponse {
  trips: TripDto[];
}

interface TripMemberDto {
  id: string;
  name: string;
}

interface GetTripMembersResponse {
  members: TripMemberDto[];
}

interface StoreState {
  currentTripId: string | null;
  groups: Trip[];
  currentTripMembers: TripMember[];
  expenses: Expense[];
  debts: DebtTransaction[];
  notes: Note[];
  stats: Stats | null;
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  initUser: () => void;
  setCurrentTripId: (tripId: string | null) => void;
  fetchExpenses: (tripId: string) => Promise<void>;
  fetchDebts: (tripId: string) => Promise<void>;
  addExpense: (expense: AddExpenseInput) => Promise<void>;
  fetchNotes: (tripId: string) => Promise<void>;
  addNote: (tripId: string, text: string) => Promise<void>;
  fetchStats: (tripId: string) => Promise<void>;
  fetchTrips: () => Promise<void>;
  fetchTripMembers: (tripId: string) => Promise<void>;
}

function mapTrip(dto: TripDto): Trip {
  return {
    id: dto.id,
    name: dto.name,
    code: dto.code,
    currency: dto.currency,
    rate: dto.rate ?? 0,
  };
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

function mapTripMember(dto: TripMemberDto): TripMember {
  return {
    id: String(dto.id),
    name: dto.name,
  };
}

function mapDebt(dto: DebtTransactionDto): DebtTransaction {
  return {
    from: dto.from,
    to: dto.to,
    amount: dto.amount,
  };
}

function mapNote(dto: NoteDto): Note {
  return {
    id: String(dto.id),
    text: dto.text,
    author: dto.author_name ?? dto.author ?? "Unknown",
    createdAt: dto.created_at ?? "",
  };
}

function mapStatsCategory(dto: StatsCategoryDto): StatsCategory {
  return {
    category: dto.category ?? dto.name ?? "Без категории",
    amount: dto.amount,
  };
}

export const useStore = create<StoreState>((set, get) => ({
  currentTripId: null,
  groups: [],
  currentTripMembers: [],
  expenses: [],
  debts: [],
  notes: [],
  stats: null,
  user: null,
  loading: false,
  error: null,

  initUser: () => {
    const tgUser = WebApp.initDataUnsafe?.user;

    if (tgUser?.id) {
      set({
        user: {
          id: String(tgUser.id),
          firstName: tgUser.first_name ?? "Telegram User",
        },
      });
      return;
    }

    if (import.meta.env.DEV) {
      set({
        user: {
          id: "5976186394",
          firstName: "Denis (Dev)",
        },
      });
      return;
    }

    set({ user: null });
  },

  setCurrentTripId: (tripId) => {
    set({ currentTripId: tripId });
  },

  fetchTrips: async () => {
    const { user } = get();
    if (!user?.id) return;

    set({ loading: true, error: null });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/trips/${encodeURIComponent(user.id)}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch trips: ${response.status}`);
      }

      const data = (await response.json()) as GetTripsResponse;
      set({
        groups: data.trips.map(mapTrip),
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

  fetchDebts: async (tripId) => {
    set({ loading: true, error: null, currentTripId: tripId });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/debts/${encodeURIComponent(tripId)}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch debts: ${response.status}`);
      }

      const data = (await response.json()) as GetDebtsResponse;
      set({
        debts: data.debts.map(mapDebt),
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

  fetchNotes: async (tripId) => {
    set({ loading: true, error: null, currentTripId: tripId });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notes/${encodeURIComponent(tripId)}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch notes: ${response.status}`);
      }

      const data = (await response.json()) as GetNotesResponse;
      set({
        notes: (data.notes ?? []).map(mapNote),
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

  addNote: async (tripId, text) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trip_id: tripId, text }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add note: ${response.status}`);
      }

      await get().fetchNotes(tripId);
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  fetchStats: async (tripId) => {
    set({ loading: true, error: null, currentTripId: tripId });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/stats/${encodeURIComponent(tripId)}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = (await response.json()) as GetStatsResponse;
      set({
        stats: {
          my: (data.my ?? data.mine ?? []).map(mapStatsCategory),
          overall: (data.overall ?? data.total ?? []).map(mapStatsCategory),
        },
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

  fetchTripMembers: async (tripId) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/members/${encodeURIComponent(tripId)}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch trip members: ${response.status}`);
      }

      const data = (await response.json()) as GetTripMembersResponse;
      set({
        currentTripMembers: data.members.map(mapTripMember),
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
