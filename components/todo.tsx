import React, { useState, useEffect } from "react";
import { Plus, Trash2, Target, Flame, Trophy } from "lucide-react";

interface Todo {
  id: string;
  task: string;
  priority: number;
  isCompleted: boolean;
}

const HabitBuilder = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState(0);
  const [loading, setLoading] = useState(true);
  const [focusGoalMet, setFocusGoalMet] = useState(false);

  useEffect(() => {
    const fetchTodos = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/todos");
        const data = await response.json();
        setTodos(data);
      } catch (error) {
        console.error("Failed to fetch todos", error);
      }
      setLoading(false);
    };

    const fetchStreakData = async () => {
      try {
        const res = await fetch("/api/current-streak");
        const data = await res.json();
        setFocusGoalMet(data.todayTime >= data.dailyGoal);
      } catch (error) {
        console.error("Failed to fetch streak data", error);
      }
    };

    fetchTodos();
    fetchStreakData();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const tempId = Date.now().toString();
    const newTodo: Todo = { id: tempId, task: newTask, priority, isCompleted: false };
    setTodos([newTodo, ...todos]);
    setNewTask("");

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: newTask, priority }),
      });
      const savedTodo = await response.json();
      setTodos((cur) => cur.map((t) => (t.id === tempId ? savedTodo : t)));
    } catch (error) {
      console.error("Failed to add task", error);
      setTodos((cur) => cur.filter((t) => t.id !== tempId));
    }
  };

  const handleMarkAsComplete = async (id: string, isCompleted: boolean) => {
    setTodos((cur) =>
      cur.map((t) => (t.id === id ? { ...t, isCompleted: !isCompleted } : t))
    );
    try {
      await fetch("/api/todos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isCompleted: !isCompleted }),
      });
    } catch (error) {
      console.error("Failed to update task", error);
      setTodos((cur) =>
        cur.map((t) => (t.id === id ? { ...t, isCompleted } : t))
      );
    }
  };

  const handleDeleteTask = async (id: string) => {
    const originalTodos = [...todos];
    setTodos((cur) => cur.filter((t) => t.id !== id));
    try {
      await fetch("/api/todos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      console.error("Failed to delete task", error);
      setTodos(originalTodos);
    }
  };

  const cyclePriority = () => {
    setPriority((p) => (p + 1) % 3);
  };

  const getPriorityLabel = () => {
    switch (priority) {
      case 1: return { color: "#facc15", label: "!" };
      case 2: return { color: "#f87171", label: "!!" };
      default: return { color: "#4ade80", label: "·" };
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-gray-500 animate-pulse text-sm">Loading habits...</div>
      </div>
    );
  }

  const completedCount = todos.filter((t) => t.isCompleted).length;
  const totalCount = todos.length;
  const allHabitsDone = totalCount > 0 && completedCount === totalCount;
  const dayComplete = allHabitsDone && focusGoalMet;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const prioInfo = getPriorityLabel();

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-green-500" />
          <h2 className="text-green-500 font-bold text-xl">Daily Goals</h2>
        </div>
        {dayComplete && (
          <div className="flex items-center gap-1 text-amber-400 animate-pulse">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Day Complete!</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400 font-medium">{completedCount} of {totalCount} goals done</span>
            <div className="flex items-center gap-2">
              {/* Focus goal indicator */}
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                focusGoalMet
                  ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                  : 'bg-gray-800 text-gray-500 border border-gray-700'
              }`}>
                <Flame className="w-3 h-3" />
                Focus
              </div>
              {/* Habits indicator */}
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                allHabitsDone
                  ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                  : 'bg-gray-800 text-gray-500 border border-gray-700'
              }`}>
                <Target className="w-3 h-3" />
                Goals
              </div>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: dayComplete
                  ? 'linear-gradient(90deg, #22c55e, #facc15)'
                  : 'linear-gradient(90deg, #22c55e, #4ade80)',
              }}
            />
          </div>
        </div>
      )}

      {/* Add habit input */}
      <form onSubmit={handleAddTask} className="mb-3 flex items-center gap-2 flex-shrink-0">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a daily goal..."
          className="flex-1 bg-black/40 text-gray-200 rounded-md py-2 px-3 text-sm outline-none border border-gray-700/60 transition-all focus:border-green-500/50 placeholder-gray-600"
        />
        <button
          type="button"
          onClick={cyclePriority}
          className="w-7 h-7 rounded-md border border-gray-700 flex items-center justify-center text-sm font-bold cursor-pointer hover:border-gray-500 transition-colors"
          style={{ color: prioInfo.color }}
          title={priority === 0 ? "Low" : priority === 1 ? "Medium" : "High"}
        >
          {prioInfo.label}
        </button>
        <button
          type="submit"
          disabled={!newTask.trim()}
          className="w-7 h-7 rounded-md bg-green-500/15 border border-green-500/30 text-green-400 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Habit list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 min-h-0">
        {todos
          .sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
            return b.priority - a.priority || b.id.localeCompare(a.id);
          })
          .map((todo) => (
            <div
              key={todo.id}
              className={`group flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 cursor-pointer ${
                todo.isCompleted
                  ? "bg-green-500/5 opacity-50"
                  : "hover:bg-white/[0.03]"
              }`}
              onClick={() => handleMarkAsComplete(todo.id, todo.isCompleted)}
            >
              {/* Custom checkbox */}
              <div
                className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  todo.isCompleted
                    ? "bg-green-500 border-green-500"
                    : "border-gray-600 group-hover:border-green-500/50"
                }`}
              >
                {todo.isCompleted && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {/* Task text */}
              <span
                className={`flex-1 text-sm truncate transition-all ${
                  todo.isCompleted ? "text-gray-500 line-through" : "text-gray-200"
                }`}
              >
                {todo.task}
              </span>

              {/* Priority dot */}
              {todo.priority > 0 && !todo.isCompleted && (
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: todo.priority === 2 ? "#f87171" : "#facc15" }}
                />
              )}

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(todo.id);
                }}
                className="p-1 text-gray-600 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

        {/* Empty state */}
        {totalCount === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-800/60 flex items-center justify-center mb-3">
              <Target className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">No daily goals yet</p>
            <p className="text-gray-600 text-xs">Add habits to track your consistency</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitBuilder;