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
