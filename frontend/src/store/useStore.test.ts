import { describe, it, expect, beforeEach } from 'vitest';
import { useStore, currentUserId } from './useStore';

describe('useStore', () => {
  beforeEach(() => {
    // Сброс состояния перед каждым тестом
    useStore.setState({ groups: [] });
  });

  it('should initialize with empty groups list', () => {
    const { groups } = useStore.getState();
    expect(groups).toEqual([]);
  });

  it('seedData should create a test group if store is empty', () => {
    useStore.getState().seedData();
    const { groups } = useStore.getState();

    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe('Тестовая поездка');
    expect(groups[0].expenses).toHaveLength(2);
  });

  it('seedData should NOT overwrite existing groups', () => {
    // Сначала добавим свою группу
    useStore.getState().addGroup({ title: 'My Group', members: [] });
    
    // Вызовем seedData
    useStore.getState().seedData();

    const { groups } = useStore.getState();
    // Должна остаться только 1 группа (наша), seedData не сработает
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe('My Group');
  });

  it('addExpense should add an expense to the correct group', () => {
    const groupId = 'test-group-1';
    useStore.getState().addGroup({
      id: groupId,
      title: 'Vacation',
      members: [{ id: currentUserId, name: 'Me' }]
    });

    useStore.getState().addExpense({
      groupId,
      title: 'Dinner',
      amount: 1200,
      payerId: currentUserId
    });

    const { groups } = useStore.getState();
    const group = groups.find(g => g.id === groupId);

    expect(group).toBeDefined();
    expect(group?.expenses).toHaveLength(1);
    expect(group?.expenses[0].title).toBe('Dinner');
    expect(group?.expenses[0].amount).toBe(1200);
  });

  it('addExpense should calculate total expenses correctly (implicitly checked)', () => {
      // Проверка логики "баланс увеличивается" = сумма расходов растет
    const groupId = 'test-group-sum';
    useStore.getState().addGroup({
      id: groupId,
      title: 'Sum Test',
      members: [{ id: currentUserId, name: 'Me' }]
    });

    const { addExpense } = useStore.getState();

    addExpense({ groupId, title: 'Item 1', amount: 100, payerId: currentUserId });
    addExpense({ groupId, title: 'Item 2', amount: 50, payerId: currentUserId });

    const group = useStore.getState().groups.find(g => g.id === groupId);
    const total = group?.expenses.reduce((sum, exp) => sum + exp.amount, 0);

    expect(total).toBe(150);
  });
});
