'use client'

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import { ArrowRight, BookOpen, Dumbbell, PenTool, TrendingUp, Timer, Music, BarChart, ListCheck, Target, Ghost, Github, ArrowUpRight } from "lucide-react";
import Image from "next/image";

const Home = () => {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleClickDash = () => {
    if (isSignedIn) {
      router.push('/dashboard');
    } else {
      router.push('/sign-in');
    }
  }

  const handleClickFocus = ()  => {
    if (isSignedIn) {
      router.push('/focus');
    } else {
      router.push('/sign-in');
    }
  }

  return (
    <div className="min-h-screen max-w-[100%] overflow-x-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-green-800 text-white">
      <Navbar/>
      <div className="container mx-auto px-4 pt-12 pb-4">
        <div className="text-center mb-16">
          <h1 className="text-6xl mt-16 font-bold mb-6">
            Achieve a little more everyday <br/>
            with your own <span className="text-green-400">Ally</span>
          </h1>
          <p className="text-2xl mb-8">
            Use Ally to track your life's stats and level up!
          </p>
          <Button onClick={handleClickDash} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition duration-300">
            {isSignedIn ? "Go to Dashboard" : "Join Ally"}
            <ArrowRight className="ml-2 h-5 w-5"/>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <FeatureCard icon={<BookOpen />} title="Study Tracking" description="Log your study hours and build a habit" />
          <FeatureCard icon={<Dumbbell />} title="Workout Logging" description="Track your fitness progress and goals" />
          <FeatureCard icon={<PenTool />} title="Journaling" description="Reflect on your day and gain insights" />
          <FeatureCard icon={<TrendingUp />} title="Progress Graphs" description="Visualize your growth over time" />
        </div>

        <div className="bg-white/10 rounded-xl p-8 mb-16">
          <div className="lg:flex lg:justify-between lg:items-center">
            <div className="lg:w-1/2 mb-8 lg:mb-0">
              <h2 className="text-3xl font-bold mb-4">Keep Track of Your Time</h2>
              <p className="text-lg mb-4">
                Our built-in <span className="text-green-400 font-semibold">Timer, Stopwatch,</span> and <span className="text-green-400 font-semibold">Pomodoro</span> features help you track every minute you spend on various activities like studying, coding, and more. Tag your time, focus better, and see where your day goes!
              </p>
              <p className="text-lg mb-4">
                And while you're working, relax with <span className="text-green-400 font-semibold">lofi music</span> available right beside the timers. Time to stay calm, lock in and be productive!
              </p>
            </div>
            <div className="lg:w-1/2">
              <div className="relative h-[40vh] w-[50vw] flex justify-center items-center">
                <div className="absolute inset-5 rounded-lg bg-green-100 blur-xl opacity-30 z-[0]" />
                <Image
                  src="/focus.png"
                  alt="Focus Page"
                  className="object-contain rounded-lg hover:scale-105 transition duration-300" 
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-8">
          <div className="lg:flex lg:justify-between lg:items-center">
            <div className="lg:w-1/2 mb-8 lg:mb-0">
              <h2 className="text-3xl font-bold mb-4">View Progress on Your Own Dashboard</h2>
              <p className="text-lg mb-4">
                Track your daily progress with visual <span className="text-green-400 font-semibold">graphs</span> showing your focus time, tasks, and tagged activities over any time period you want.
              </p>
              <p className="text-lg mb-4">
                Set <span className="text-green-400 font-semibold">daily goals, build streaks, and view recent sessions.</span> You can also add upcoming tasks, track your most productive hours, and see focus trends to keep improving.
              </p>
            </div> 
            <div className="lg:w-1/2">
              <div className="relative h-[40vh] w-[50vw] flex justify-center items-center">
                <div className="absolute inset-5 rounded-lg bg-green-100 blur-xl opacity-30 z-[0]" />
                <Image
                  src="/dashboard.png"
                  alt="Focus Page"
                  className="object-contain rounded-lg hover:scale-105 transition duration-300" 
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <hr className="border-0 h-1 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 rounded-full my-10"/>
          
          <div className="bg-white/10 rounded-lg p-12 mx-auto max-w-3xl mb-8">
            <h2 className="text-3xl mb-5 font-bold text-center">How Can Ally Help You?</h2>

            <h3 className="text-xl font-bold mb-2">Turning Focus Into a Habit</h3>
            <p>
              Staying focused can feel like a constant battle. With endless distractions and the instant gratification of scrolling, it's no wonder that sometimes, focusing on what matters most feels like the hardest thing to do. It’s not that procrastination is more enjoyable—it’s just easier. But what if focusing could become just as rewarding?
            </p>
            <p>
              The truth is, it can. Like any skill, focus gets easier when it becomes a habit. And once it’s a habit, it starts to feel less like a chore and more like something you do naturally—without having to force it.
            </p>

            <h3 className="text-xl font-bold mb-2 mt-5">Data-Driven Growth</h3>
            <p>
              Building good habits isn’t something that happens overnight. It takes time, patience, and small, steady progress. But the good news is that every little bit counts. That’s where Ally steps in. By giving you the tools to track your progress—whether it’s your study hours, workout routines, or focus time—Ally helps you stay accountable and see just how far you’ve come.
            </p>
            <p>
              It’s not about instant results. It’s about building something sustainable, where even the smallest wins matter. Watching the graphs grow or maintaining a streak might seem simple, but these visual cues can provide the motivation you need to keep pushing yourself—little by little, day by day.
            </p>

            <h3 className="text-xl font-bold mb-2 mt-5">Keep Moving Forward</h3>
            <p>
              Ally isn’t just about tracking; it’s about understanding. The data you gather helps you recognize what’s working and what’s not. It gives you the insights to fine-tune your habits and keep improving. Plus, Ally’s journaling features are here to support your mental well-being, helping you reflect on your progress and your goals.
            </p>
            <p>
              No matter how slow it feels, progress is still progress. The key is to keep going, even when it feels tough. Building good habits is a long game, and every small step adds up to something bigger. With Ally by your side, you’re never alone in that journey.
            </p>

          </div>

          <hr className="border-0 h-1 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 rounded-full my-10"/>

          <div className="bg-white/10 rounded-lg p-8 mb-16">
            <h2 className="text-3xl font-bold mb-5">Contribute</h2>
            <p className="text-lg">
              Ally is open-source and all contributions are welcome! Whether its adding new features, fixing bugs, giving feedback or reporting issues,
              your involvement will help this project grow. Feel free to head over to GitHub to contribute or simply give this project a star!
            </p>

          <a href="https://github.com/tyagidevansh/Ally" target="_blank" className="inline-flex items-center border-2 mt-4 border-white text-white font-bold py-3 px-6 rounded-full transition duration-300 hover:bg-white hover:text-purple-900" rel="noreferrer">
            <Github/>	&nbsp; Head over to GitHub <ArrowUpRight/>
          </a>

          </div>

        </div>

        <div className="text-center">
          <Button onClick={handleClickFocus} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-full transition duration-300">
            {isSignedIn? "Start Focusing" : "Start Your Journey Now"} <ArrowRight className="ml-2 h-5 w-5"/>
          </Button>
        </div>

        <div className="flex justify-center items-center text-gray-100 text-md mt-5">
          Made with <span className="text-red-500">&nbsp;❤️&nbsp;</span> by <a href="https://github.com/tyagidevansh" className="hover:underline"> &nbsp; @tyagidevansh</a>
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
