import { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import AddExpenseScreen from "./screens/AddExpenseScreen";
import GroupDetailsScreen from "./screens/GroupDetailsScreen";
import { useStore } from "./store/useStore";

type ScreenName = "details" | "add";

function App() {
  const [screen, setScreen] = useState<ScreenName>("details");
  // TODO: Get this from URL start_param
  const [tripId] = useState<string>("test-trip"); 
  const initUser = useStore((state) => state.initUser);

  useEffect(() => {
    // Initialize Telegram SDK
    WebApp.ready();
    WebApp.expand();
    // Initialize User
    initUser();
  }, [initUser]);

  const goToDetails = () => setScreen("details");
  const goToAdd = () => setScreen("add");

  return (
    <div className="relative min-h-screen bg-slate-50 max-w-md mx-auto shadow-xl">
      {screen === "details" && (
        <>
            <GroupDetailsScreen tripId={tripId} onBack={() => {}} />
            <button
                aria-label="Добавить расход"
                className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-3xl leading-none text-white shadow-lg hover:bg-blue-700 transition active:scale-95"
                onClick={goToAdd}
                type="button"
            >
            +
            </button>
        </>
      )}
      
      {screen === "add" && (
        <AddExpenseScreen tripId={tripId} onBack={goToDetails} />
      )}
    </div>
  );
}

export default App;
