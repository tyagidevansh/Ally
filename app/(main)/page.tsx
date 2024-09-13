'use client'

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import { ArrowRight, BookOpen, Dumbbell, PenTool, TrendingUp } from "lucide-react";

const Home = () => {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    if (isSignedIn) {
      router.push('/dashboard');
    } else {
      router.push('/sign-in');
    }
  }

  return ( 
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-green-900 text-white">
      <Navbar/>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-6xl mt-6 font-bold mb-6">
            Achieve a little more everyday <br/>
            with your own <span className="text-green-400">Ally</span>
          </h1>
          <p className="text-2xl mb-8">
            Use Ally to track your life's stats and level up!
          </p>
          <Button onClick={handleClick} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition duration-300">
            {isSignedIn ? "Go to Dashboard" : "Join Ally"}
            <ArrowRight className="ml-2 h-5 w-5"/>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <FeatureCard icon={<BookOpen />} title="Study Tracking" description="Log your study hours and earn points" />
          <FeatureCard icon={<Dumbbell />} title="Workout Logging" description="Track your fitness progress and goals" />
          <FeatureCard icon={<PenTool />} title="Journaling" description="Reflect on your day and gain insights" />
          <FeatureCard icon={<TrendingUp />} title="Progress Graphs" description="Visualize your growth over time" />
        </div>

        <div className="bg-white/10 rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold mb-4">Your Monthly Progress</h2>
          <div className="h-64 bg-white/5 rounded-lg">
            {/* Placeholder for graph */}
            <p className="text-center py-24">Monthly progress graph will be displayed here</p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Join thousands of users leveling up their lives</h2>
          <div className="flex justify-center space-x-4 mb-8">
            {/* Placeholder for user avatars or testimonials */}
            <div className="w-12 h-12 bg-white/20 rounded-full"></div>
            <div className="w-12 h-12 bg-white/20 rounded-full"></div>
            <div className="w-12 h-12 bg-white/20 rounded-full"></div>
          </div>
          <Button onClick={handleClick} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-full transition duration-300">
            Start Your Journey Now
          </Button>
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white/10 rounded-xl p-6 text-center transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:bg-white/15">
    <div className="text-green-400 mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p>{description}</p>
  </div>
);
 
export default Home;