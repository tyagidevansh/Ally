import { useState, useEffect } from "react";

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

  // Fetch the list of todos from the API
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await fetch("/api/todos");
        const data = await response.json();
        setTodos(data);
      } catch (error) {
        console.error("Failed to fetch todos", error);
      }
    };

    fetchTodos();
  }, []);

  // Handle new task submission
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTask.trim()) {
      return;
    }

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task: newTask, priority }),
      });

      const newTodo = await response.json();
      setTodos([newTodo, ...todos]);
      setNewTask(""); // Clear input field
      setPriority(0); // Reset priority
    } catch (error) {
      console.error("Failed to add task", error);
    }
  };

  // Handle marking task as completed
  const handleMarkAsComplete = async (id: string, isCompleted: boolean) => {
    try {
      const response = await fetch("/api/todos", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, isCompleted: !isCompleted }),
      });

      const updatedTodo = await response.json();
      setTodos(todos.map(todo => todo.id === updatedTodo.id ? updatedTodo : todo));
    } catch (error) {
      console.error("Failed to update task", error);
    }
  };

  // Handle deleting a task
  const handleDeleteTask = async (id: string) => {
    try {
      await fetch("/api/todos", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  };

  return (
    <div className="todo-list">
      <h2 className="text-green-500 font-bold mb-4 text-xl">To-Do List</h2>

      <form onSubmit={handleAddTask} className="mb-4">
        <input 
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Enter new task"
          className="border p-2 rounded w-full"
        />
        <div className="flex mt-2">
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value))}
            placeholder="Priority"
            className="border p-2 rounded w-20"
          />
          <button type="submit" className="ml-4 bg-green-500 text-white p-2 rounded">
            Add Task
          </button>
        </div>
      </form>

      <ul>
        {todos.map(todo => (
          <li key={todo.id} className="border p-2 mb-2 rounded flex justify-between items-center">
            <span
              style={{ textDecoration: todo.isCompleted ? "line-through" : "none" }}
            >
              {todo.task}
            </span>
            <div className="flex">
              <button
                className={`mr-2 ${todo.isCompleted ? 'bg-gray-500' : 'bg-green-500'} text-white p-2 rounded`}
                onClick={() => handleMarkAsComplete(todo.id, todo.isCompleted)}
              >
                {todo.isCompleted ? "Undo" : "Complete"}
              </button>
              <button
                className="bg-red-500 text-white p-2 rounded"
                onClick={() => handleDeleteTask(todo.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ToDoList;
