import { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import AddExpenseScreen from "./screens/AddExpenseScreen";
import AuthFallbackScreen from "./screens/AuthFallbackScreen";
import DebtsScreen from "./screens/DebtsScreen";
import ExpenseDetailsScreen from "./screens/ExpenseDetailsScreen";
import GroupDetailsScreen from "./screens/GroupDetailsScreen";
import GroupsScreen from "./screens/GroupsScreen";
import JoinTripScreen from "./screens/JoinTripScreen";
import NotesScreen from "./screens/NotesScreen";
import RouletteScreen from "./screens/RouletteScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SplashScreen from "./screens/SplashScreen";
import StatsScreen from "./screens/StatsScreen";
import { useStore } from "./store/useStore";

type ScreenName =
  | "groups"
  | "groupDetails"
  | "addExpense"
  | "debts"
  | "expenseDetails"
  | "stats"
  | "notes"
  | "roulette"
  | "joinTrip"
  | "settings";

function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [screen, setScreen] = useState<ScreenName>("groups");
  const [lastScreen, setLastScreen] = useState<ScreenName>("groups");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
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

    const splashTimer = window.setTimeout(() => {
      setIsSplashVisible(false);
    }, 900);

    return () => window.clearTimeout(splashTimer);
  }, [initUser]);

  useEffect(() => {
    if (user) {
      void fetchTrips();
    }
  }, [user, fetchTrips]);

  const navigate = (nextScreen: ScreenName) => {
    if (nextScreen !== "settings") {
      setLastScreen(nextScreen);
    }
    setScreen(nextScreen);
  };

  const openSettings = () => {
    setLastScreen(screen);
    setScreen("settings");
  };

  if (isSplashVisible) {
    return <SplashScreen onOpenSettings={openSettings} />;
  }

  if (authInitialized && user === null && !loading) {
    return <AuthFallbackScreen onOpenSettings={openSettings} />;
  }

  const addExpenseGroupId = selectedGroupId ?? groups[0]?.id ?? null;

  return (
    <div className="mx-auto h-screen max-w-xl overflow-hidden bg-app-gradient md:my-4 md:h-[calc(100vh-2rem)] md:rounded-screen md:border md:border-borderSoft md:shadow-card">
      {screen === "groups" ? (
        <GroupsScreen
          onOpenJoinTrip={() => navigate("joinTrip")}
          onOpenSettings={openSettings}
          onSelectGroup={(groupId) => {
            setSelectedGroupId(groupId);
            navigate("groupDetails");
          }}
        />
      ) : null}

      {screen === "groupDetails" && selectedGroupId ? (
        <GroupDetailsScreen
          onBack={() => navigate("groups")}
          onOpenAddExpense={() => navigate("addExpense")}
          onOpenDebts={() => navigate("debts")}
          onOpenExpense={(expenseId) => {
            setSelectedExpenseId(expenseId);
            navigate("expenseDetails");
          }}
          onOpenNotes={() => navigate("notes")}
          onOpenRoulette={() => navigate("roulette")}
          onOpenSettings={openSettings}
          onOpenStats={() => navigate("stats")}
          tripId={selectedGroupId}
        />
      ) : null}

      {screen === "addExpense" ? (
        <AddExpenseScreen
          onBack={() => navigate(selectedGroupId ? "groupDetails" : "groups")}
          onOpenSettings={openSettings}
          tripId={addExpenseGroupId}
        />
      ) : null}

      {screen === "debts" && selectedGroupId ? (
        <DebtsScreen
          onBack={() => navigate("groupDetails")}
          onOpenSettings={openSettings}
          tripId={selectedGroupId}
        />
      ) : null}

      {screen === "expenseDetails" && selectedExpenseId ? (
        <ExpenseDetailsScreen
          expenseId={selectedExpenseId}
          onBack={() => navigate("groupDetails")}
          onOpenSettings={openSettings}
        />
      ) : null}

      {screen === "stats" && selectedGroupId ? (
        <StatsScreen
          onBack={() => navigate("groupDetails")}
          onOpenSettings={openSettings}
          tripId={selectedGroupId}
        />
      ) : null}

      {screen === "notes" && selectedGroupId ? (
        <NotesScreen
          onBack={() => navigate("groupDetails")}
          onOpenSettings={openSettings}
          tripId={selectedGroupId}
        />
      ) : null}

      {screen === "roulette" && selectedGroupId ? (
        <RouletteScreen
          onBack={() => navigate("groupDetails")}
          onOpenSettings={openSettings}
          tripId={selectedGroupId}
        />
      ) : null}

      {screen === "joinTrip" ? (
        <JoinTripScreen onBack={() => navigate("groups")} onOpenSettings={openSettings} />
      ) : null}

      {screen === "settings" ? (
        <SettingsScreen
          onBack={() => {
            setScreen(lastScreen);
          }}
        />
      ) : null}
    </div>
  );
}

export default App;
