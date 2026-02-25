import { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import AddExpenseScreen from "./screens/AddExpenseScreen";
import DebtsScreen from "./screens/DebtsScreen";
import GroupDetailsScreen from "./screens/GroupDetailsScreen";
import GroupsScreen from "./screens/GroupsScreen";
import { useStore } from "./store/useStore";

type ScreenName = "groups" | "groupDetails" | "addExpense" | "debts";

function App() {
  const [screen, setScreen] = useState<ScreenName>("groups");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const groups = useStore((state) => state.groups);
  const fetchTrips = useStore((state) => state.fetchTrips);
  const initUser = useStore((state) => state.initUser);
  const user = useStore((state) => state.user);
  const loading = useStore((state) => state.loading);

  useEffect(() => {
    initUser();
    setAuthInitialized(true);
    WebApp.ready();
    WebApp.expand();
  }, [initUser]);

  useEffect(() => {
    if (user) {
      fetchTrips();
    }
  }, [user, fetchTrips]);

  const openGroupDetails = (groupId: string) => {
    setSelectedGroupId(groupId);
    setScreen("groupDetails");
  };

  const goToGroups = () => {
    setScreen("groups");
  };

  const goToAddExpense = () => {
    setScreen("addExpense");
  };

  const goToDebts = () => {
    setScreen("debts");
  };

  const addExpenseGroupId = selectedGroupId ?? groups[0]?.id ?? null;

  if (authInitialized && user === null && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto mt-16 max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h1 className="text-xl font-semibold text-slate-900">Splitopus 🐙</h1>
          <p className="mt-3 text-sm text-slate-600">
            Пожалуйста, откройте приложение через Telegram.
          </p>
          <a
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm"
            href="https://t.me/SplitopusBot"
            rel="noreferrer"
            target="_blank"
          >
            Открыть бота
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      {screen === "groups" ? <GroupsScreen onSelectGroup={openGroupDetails} /> : null}
      {screen === "groupDetails" && selectedGroupId ? (
        <GroupDetailsScreen
          tripId={selectedGroupId}
          onBack={goToGroups}
          onOpenDebts={goToDebts}
          onOpenAddExpense={goToAddExpense}
        />
      ) : null}
      {screen === "addExpense" ? (
        <AddExpenseScreen
          tripId={addExpenseGroupId}
          onBack={() => setScreen(selectedGroupId ? "groupDetails" : "groups")}
        />
      ) : null}
      {screen === "debts" && selectedGroupId ? (
        <DebtsScreen tripId={selectedGroupId} onBack={() => setScreen("groupDetails")} />
      ) : null}
    </div>
  );
}

export default App;
