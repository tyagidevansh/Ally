import { Chart } from "@/components/chart";
import { ModeToggle } from "@/components/mode-toggle";
import { UserButton } from "@clerk/nextjs";

const Home = () => {

  return ( 
    <div className="font-bold dark:bg-zinc-800 h-full text-white">
      <div>
        <UserButton/>
      </div>
      <div>
        <ModeToggle/>
      </div> 
      <div>
      <Chart/>
      </div>
    </div>
   );
}
 
export default Home;