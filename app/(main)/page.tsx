import { UserButton } from "@clerk/nextjs";

const Home = () => {
  return ( 
    <div className="font-bold bg-zinc-800 h-full text-white">
      <UserButton/>
    </div>
   );
}
 
export default Home;