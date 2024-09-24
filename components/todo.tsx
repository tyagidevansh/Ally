import { useState, useEffect } from "react";
import { PlusCircle, Trash2 } from "lucide-react";

const ToDoList = () => {
  interface Todo {
    id: string;
    task: string;
    priority: number;
    isCompleted: boolean;
  }

  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState(0);
  const [loading, setLoading] = useState(true);

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

    fetchTodos();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTask.trim()) {
      return;
    }

    const tempId = Date.now().toString(); 

    const newTodo: Todo = { id: tempId, task: newTask, priority, isCompleted: false };
    setTodos([newTodo, ...todos]);
    setNewTask("");
    // setPriority(0);

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task: newTask, priority }),
      });

      const savedTodo = await response.json();

      setTodos((currentTodos) =>
        currentTodos.map((todo) => (todo.id === tempId ? savedTodo : todo))
      );
    } catch (error) {
      console.error("Failed to add task", error);

      setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== tempId));
    }
  };

  const handleMarkAsComplete = async (id: string, isCompleted: boolean) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, isCompleted: !isCompleted } : todo
      )
    );

    try {
      await fetch("/api/todos", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, isCompleted: !isCompleted }),  
      });
    } catch (error) {
      console.error("Failed to update task", error);
      
      setTodos((currentTodos) =>
        currentTodos.map((todo) =>
          todo.id === id ? { ...todo, isCompleted } : todo 
        )
      );
    }
  };

  const handleDeleteTask = async (id: string) => {
    const originalTodos = [...todos];
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));

    try {
      await fetch("/api/todos", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      console.error("Failed to delete task", error);

      setTodos(originalTodos);
    }
  };

  const cyclePriority = () => {
    setPriority((prevPriority) => (prevPriority + 1) % 3);
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 1:
        return "bg-yellow-400";
      case 2:
        return "bg-red-400";
      default:
        return "bg-green-400";
    }
  };

  const getPriorityTooltip = () => {
    switch (priority) {
      case 1:
        return "Medium Priority";
      case 2:
        return "High Priority";
      default:
        return "Low Priority";
    }
  };

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="h-full w-full custom-scrollbar overflow-y-auto" style={{ maxHeight: 'calc(150vh / 2)' }}>
      <h2 className="text-green-500 font-bold mb-4 text-xl">To-Do</h2>

      <form onSubmit={handleAddTask} className="mb-4 p-1 flex items-center space-x-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Enter new task"
          className="border p-2 rounded flex-grow"
        />

        <div
          className={`w-6 h-6 rounded-full cursor-pointer ${getPriorityColor()}`}
          onClick={cyclePriority}
          title={getPriorityTooltip()}
        ></div>

        <button type="submit">
          <PlusCircle className="text-green-500 w-8 h-8 cursor-pointer" />
        </button>
      </form>

      <ul>
        {todos
          .sort((a, b) => b.priority - a.priority || b.id.localeCompare(a.id)) // Sort by priority and order
          .map((todo) => (
            <li
              key={todo.id}
              className="border border-gray-500 p-2 mb-2 m-1 rounded-md flex justify-between items-center hover:border-none hover:outline hover:outline-2 group"
              style={{
                outlineColor:
                  todo.priority === 2 ? "red" : todo.priority === 1 ? "yellow" : "green",
              }}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={todo.isCompleted}
                  onChange={() => handleMarkAsComplete(todo.id, todo.isCompleted)}
                  className="mr-2"
                />
                <span
                  style={{ textDecoration: todo.isCompleted ? "line-through" : "none" }}
                >
                  {todo.task}
                </span>
              </div>

              <button 
                onClick={() => handleDeleteTask(todo.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-50"  
              >
                <Trash2 className="text-red-500 w-6 h-6 cursor-pointer" />
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default ToDoList;