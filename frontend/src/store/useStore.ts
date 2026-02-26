import WebApp from "@twa-dev/sdk";
import { create } from "zustand";

const API_BASE_URL = "";

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  payerId: string;
  payerName?: string;
  createdAt: string;
  split?: Record<string, number>;
  splitDetails?: Array<{ userId?: string; name: string; amount: number }>;
}

interface ExpenseDto {
  id: string;
  amount: number;
  description: string;
  category: string;
  payer_id: string;
  payer_name?: string;
  created_at: string;
  split?: Record<string, number>;
  split_details?: Array<{ user_id?: string; name?: string; amount: number }>;
  participants?: Array<{ user_id?: string; name?: string; amount?: number; share?: number }>;
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
  by_category?: Record<string, number>;
  my_by_category?: Record<string, number>;
  my_category?: Record<string, number>;
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

export interface ParticipantBalance {
  userId?: string;
  name: string;
  amount: number;
}

interface DebtTransactionDto {
  from: string;
  to: string;
  amount: number;
}

interface GetDebtsResponse {
  balances?: Record<string, number>;
  balances_list?: Array<{ user_id?: string; name?: string; amount: number }>;
  participants?: Array<{ user_id?: string; name?: string; balance: number }>;
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
  balances: ParticipantBalance[];
  notes: Note[];
  stats: Stats | null;
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  initUser: () => void;
  setCurrentTripId: (tripId: string | null) => void;
  fetchExpenses: (tripId: string) => Promise<void>;
  fetchDebts: (tripId: string) => Promise<void>;
  notifyDebts: (tripId: string) => Promise<void>;
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
  const splitDetails =
    dto.split_details?.map((item) => ({
      userId: item.user_id ? String(item.user_id) : undefined,
      name: item.name ?? "Участник",
      amount: item.amount,
    })) ??
    dto.participants?.map((item) => ({
      userId: item.user_id ? String(item.user_id) : undefined,
      name: item.name ?? "Участник",
      amount: item.amount ?? item.share ?? 0,
    }));

  return {
    id: dto.id,
    amount: dto.amount,
    description: dto.description,
    category: dto.category,
    payerId: dto.payer_id,
    payerName: dto.payer_name,
    createdAt: dto.created_at,
    split: dto.split,
    splitDetails,
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

function mapBalances(data: GetDebtsResponse): ParticipantBalance[] {
  if (Array.isArray(data.balances_list)) {
    return data.balances_list.map((item) => ({
      userId: item.user_id ? String(item.user_id) : undefined,
      name: item.name ?? "Участник",
      amount: item.amount,
    }));
  }

  if (Array.isArray(data.participants)) {
    return data.participants.map((item) => ({
      userId: item.user_id ? String(item.user_id) : undefined,
      name: item.name ?? "Участник",
      amount: item.balance,
    }));
  }

  if (data.balances) {
    return Object.entries(data.balances).map(([name, amount]) => ({
      name,
      amount,
    }));
  }

  return [];
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

function mapCategoryRecord(record?: Record<string, number>): StatsCategory[] {
  if (!record) {
    return [];
  }

  return Object.entries(record).map(([category, amount]) => ({
    category,
    amount,
  }));
}

export const useStore = create<StoreState>((set, get) => ({
  currentTripId: null,
  groups: [],
  currentTripMembers: [],
  expenses: [],
  debts: [],
  balances: [],
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
        balances: mapBalances(data),
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

  notifyDebts: async (tripId) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/debts/${encodeURIComponent(tripId)}/notify`,
        { method: "POST" },
      );

      if (!response.ok) {
        throw new Error(`Failed to notify debts: ${response.status}`);
      }

      set({ loading: false, error: null });
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
      const userId = String(get().user?.id ?? "");
      const response = await fetch(`${API_BASE_URL}/api/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trip_id: String(tripId),
          user_id: userId,
          text,
        }),
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
      const userId = get().user?.id ? String(get().user?.id) : "";
      const response = await fetch(
        `${API_BASE_URL}/api/stats/${encodeURIComponent(tripId)}?user_id=${encodeURIComponent(userId)}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = (await response.json()) as GetStatsResponse;
      const myFromRecord = mapCategoryRecord(data.my_category ?? data.my_by_category);
      const overallFromRecord = mapCategoryRecord(data.by_category);

      set({
        stats: {
          my:
            myFromRecord.length > 0
              ? myFromRecord
              : (data.my ?? data.mine ?? []).map(mapStatsCategory),
          overall:
            overallFromRecord.length > 0
              ? overallFromRecord
              : (data.overall ?? data.total ?? []).map(mapStatsCategory),
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
