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
  const groups = useStore((state) => state.groups);
  const fetchTrips = useStore((state) => state.fetchTrips);
  const initUser = useStore((state) => state.initUser);
  const user = useStore((state) => state.user);

  useEffect(() => {
    initUser();
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

  return (
    <div className="relative min-h-screen bg-slate-50">
      {screen === "groups" ? <GroupsScreen onSelectGroup={openGroupDetails} /> : null}
      {screen === "groupDetails" && selectedGroupId ? (
        <GroupDetailsScreen
          tripId={selectedGroupId}
          onBack={goToGroups}
          onOpenDebts={goToDebts}
        />
      ) : null}
      {screen === "addExpense" ? (
        <AddExpenseScreen tripId={addExpenseGroupId} onBack={goToGroups} />
      ) : null}
      {screen === "debts" && selectedGroupId ? (
        <DebtsScreen tripId={selectedGroupId} onBack={() => setScreen("groupDetails")} />
      ) : null}

      {screen === "groups" ? (
        <button
          aria-label="Добавить расход"
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-3xl leading-none text-white shadow-lg hover:bg-slate-800"
          onClick={goToAddExpense}
          type="button"
        >
          +
        </button>
      ) : null}
    </div>
  );
}

export default App;
