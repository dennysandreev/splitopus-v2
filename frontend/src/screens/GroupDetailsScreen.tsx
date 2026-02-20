import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";

interface GroupDetailsScreenProps {
  groupId: string;
  onBack: () => void;
}

function GroupDetailsScreen({ groupId, onBack }: GroupDetailsScreenProps) {
  const group = useStore((state) => state.groups.find((item) => item.id === groupId));

  if (!group) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar onBack={onBack} title="Группа не найдена" />
      </div>
    );
  }

  const totalSpent = group.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const spentByMember = group.members.map((member) => ({
    id: member.id,
    name: member.name,
    total: group.expenses
      .filter((expense) => expense.payerId === member.id)
      .reduce((sum, expense) => sum + expense.amount, 0),
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onBack={onBack} title={group.title} />
      <main className="space-y-4 p-4">
        <Card>
          <p className="text-sm text-slate-500">Всего потрачено в группе</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{totalSpent} ₽</p>
        </Card>

        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Кто сколько потратил
          </h2>
          {spentByMember.map((member) => (
            <Card key={member.id}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">{member.name}</p>
                <p className="text-sm text-slate-700">{member.total} ₽</p>
              </div>
            </Card>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Последние расходы
          </h2>
          {group.expenses.map((expense) => (
            <Card key={expense.id}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">{expense.title}</p>
                <p className="text-sm text-slate-700">{expense.amount} ₽</p>
              </div>
            </Card>
          ))}
          {group.expenses.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">Расходов пока нет</p>
            </Card>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default GroupDetailsScreen;
