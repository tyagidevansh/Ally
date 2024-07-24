import { Chart } from "@/components/chart";
import { ModeToggle } from "@/components/mode-toggle";
import { UserButton } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { initialProfile } from "@/lib/initial-profile";

const Home = async () => {
  const profile = await initialProfile();

  return ( 
    <div className="font-bold dark:bg-zinc-800 h-full text-white">
      <div>
        <UserButton/>
      </div>
      <div>
        <ModeToggle/>
      </div> 
      <div>
        Hello {profile.name}!
      </div>
    </div>
   );
}
 
export default Home;