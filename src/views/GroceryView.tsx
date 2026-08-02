import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { Card } from '@/components/common/Card';
import { DEFAULT_GROCERY, getTodayKey } from '@/utils/constants';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';

interface GroceryViewProps {
  isDark?: boolean;
}

export const GroceryView: React.FC<GroceryViewProps> = () => {
  const todayKey = getTodayKey();
  const dailyRecord = useLiveQuery(() => db.dailyRecords.get(todayKey), [todayKey]);
  const customItems = useLiveQuery(() => db.customGroceryItems.toArray(), []);

  const checkedKeys = dailyRecord?.groceryChecked || [];
  const [customInput, setCustomInput] = useState('');

  const handleToggleDefault = async (key: string) => {
    const current = await db.dailyRecords.get(todayKey);
    const existing = current?.groceryChecked || [];
    const isAdding = !existing.includes(key);

    const updated = isAdding
      ? [...existing, key]
      : existing.filter((k) => k !== key);

    await db.dailyRecords.put({
      date: todayKey,
      water: current?.water || 0,
      creatine: current?.creatine || 0,
      workout: current?.workout || null,
      mood: current?.mood || null,
      routineDone: current?.routineDone || [],
      mealsDone: current?.mealsDone || { breakfast: false, lunch: false, dinner: false, snack: false },
      groceryChecked: updated,
    });
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    await db.customGroceryItems.add({
      id: `custom-${Date.now()}`,
      name: customInput.trim(),
      category: 'custom',
      checked: false,
    });

    setCustomInput('');
  };

  const handleToggleCustom = async (id: string, currentChecked: boolean) => {
    await db.customGroceryItems.update(id, { checked: !currentChecked });
  };

  const handleDeleteCustom = async (id: string) => {
    await db.customGroceryItems.delete(id);
  };

  const renderCategoryList = (categoryKey: string, title: string, items: string[]) => {
    return (
      <Card title={title} subtitle="Weekly Supply Target" color="cream">
        <div className="space-y-1.5 pt-1">
          {items.map((item, idx) => {
            const key = `${categoryKey}-${idx}`;
            const isChecked = checkedKeys.includes(key);
            return (
              <div
                key={key}
                onClick={() => handleToggleDefault(key)}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition ${
                  isChecked
                    ? 'border-[#a4d4c5] bg-[#a4d4c5]/20 text-[var(--text-muted)] line-through'
                    : 'border-[var(--hairline)] bg-[var(--canvas)] text-[var(--ink)] hover:bg-[var(--surface-soft)]'
                }`}
              >
                <span>{item}</span>
                {isChecked ? <CheckSquare className="h-4 w-4 text-[#ff4d8b]" /> : <Square className="h-4 w-4 text-[var(--text-muted)]" />}
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-['Space_Grotesk'] text-3xl font-extrabold tracking-tight text-[var(--ink)]">Weekly Grocery Checklist</h2>
          <p className="text-sm font-semibold text-[var(--text-muted)]">Weekly Supply Ingestion • Vegetables, Fruits, Protein & Carbohydrates</p>
        </div>
      </div>

      {/* Grocery Categories */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {renderCategoryList('veg', 'Vegetables (Fresh Weekly)', DEFAULT_GROCERY.veg)}
        {renderCategoryList('fruit', 'Fruits (Weekly Supply)', DEFAULT_GROCERY.fruit)}
        {renderCategoryList('protein', 'Protein & Dairy Sources', DEFAULT_GROCERY.protein)}
        {renderCategoryList('carbs', 'Carbs & Essentials', DEFAULT_GROCERY.carbs)}
      </div>

      {/* Custom Items Manager */}
      <Card title="Custom Grocery Additions" subtitle="Manage custom items for the week" color="cream">
        <form onSubmit={handleAddCustom} className="mb-4 flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Add custom item name & quantity..."
            className="flex-1 rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-full bg-[#ff4d8b] px-5 py-2 text-xs font-bold text-white hover:opacity-90 transition shadow-sm"
          >
            <Plus className="h-4 w-4 text-white" />
            <span>Add Item</span>
          </button>
        </form>

        <div className="space-y-2">
          {customItems?.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition ${
                item.checked
                  ? 'border-[#a4d4c5] bg-[#a4d4c5]/20 text-[var(--text-muted)] line-through'
                  : 'border-[var(--hairline)] bg-[var(--canvas)] text-[var(--ink)]'
              }`}
            >
              <div
                onClick={() => handleToggleCustom(item.id, item.checked)}
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                {item.checked ? <CheckSquare className="h-4 w-4 text-[#ff4d8b]" /> : <Square className="h-4 w-4 text-[var(--text-muted)]" />}
                <span>{item.name}</span>
              </div>
              <button
                onClick={() => handleDeleteCustom(item.id)}
                className="text-[var(--text-muted)] hover:text-[#ff4d8b] transition p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {customItems?.length === 0 && (
            <p className="py-4 text-center text-xs font-semibold text-[var(--text-muted)]">No custom items added for this week.</p>
          )}
        </div>
      </Card>
    </div>
  );
};
