import { useEffect, useState } from "react";
import AddExpenseScreen from "./screens/AddExpenseScreen";
import GroupDetailsScreen from "./screens/GroupDetailsScreen";
import GroupsScreen from "./screens/GroupsScreen";
import { useStore } from "./store/useStore";

type ScreenName = "groups" | "groupDetails" | "addExpense";

function App() {
  const [screen, setScreen] = useState<ScreenName>("groups");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const groups = useStore((state) => state.groups);
  const seedData = useStore((state) => state.seedData);

  useEffect(() => {
    seedData();
  }, [seedData]);

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

  const addExpenseGroupId = selectedGroupId ?? groups[0]?.id ?? null;

  return (
    <div className="relative min-h-screen bg-slate-50">
      {screen === "groups" ? <GroupsScreen onSelectGroup={openGroupDetails} /> : null}
      {screen === "groupDetails" && selectedGroupId ? (
        <GroupDetailsScreen groupId={selectedGroupId} onBack={goToGroups} />
      ) : null}
      {screen === "addExpense" ? (
        <AddExpenseScreen groupId={addExpenseGroupId} onBack={goToGroups} />
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
