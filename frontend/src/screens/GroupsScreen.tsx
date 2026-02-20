import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";

interface GroupsScreenProps {
  onSelectGroup: (groupId: string) => void;
}

function GroupsScreen({ onSelectGroup }: GroupsScreenProps) {
  const groups = useStore((state) => state.groups);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar title="Splitopus 🐙" />
      <main className="space-y-3 p-4">
        {groups.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">Групп пока нет</p>
          </Card>
        ) : null}
        {groups.map((group) => (
          <button
            className="w-full text-left"
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            type="button"
          >
            <Card className="transition-colors hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-base font-medium text-slate-900">{group.title}</p>
                <p className="text-sm font-semibold text-emerald-600">
                  {group.expenses.reduce((sum, item) => sum + item.amount, 0)} ₽
                </p>
              </div>
            </Card>
          </button>
        ))}
      </main>
    </div>
  );
}

export default GroupsScreen;
