import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PomodoroProps {
  onChangeTimer : (value : string) => void;
}

const Pomodoro = ({onChangeTimer} : PomodoroProps) => {
  return (  
    <div>
      pomodoro

      <Select onValueChange={onChangeTimer}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Change timer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Stopwatch">Stopwatch</SelectItem>
              <SelectItem value="Timer">Timer</SelectItem>
              <SelectItem value="Pomodoro">Pomodoro</SelectItem>
            </SelectContent>
          </Select>

    </div>
  );
}
 
export default Pomodoro;