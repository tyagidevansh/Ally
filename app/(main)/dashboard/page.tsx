import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import DashboardClient from './dashboard-client';
import { currentProfile } from '@/lib/current-profile';
import { redirect } from 'next/navigation';
import { 
  getStreak, 
  getFocusComparison, 
  getProductiveHours, 
  getRecentTimes, 
  getFriendsStats, 
  getFriendRequests, 
  getTodos 
} from '@/lib/dashboard-queries';

export default async function DashboardPage() {
  const profile = await currentProfile();
  
  if (!profile) {
    return redirect('/sign-in');
  }

  const queryClient = new QueryClient();

  // Prefetch dashboard data on the server to avoid client-side API waterfall
  // and bypass Vercel Serverless cold-start limits.
  await Promise.all([
    queryClient.prefetchQuery({ 
      queryKey: ['streak'], 
      queryFn: () => getStreak(profile) 
    }),
    queryClient.prefetchQuery({ 
      queryKey: ['comparison'], 
      queryFn: () => getFocusComparison(profile) 
    }),
    queryClient.prefetchQuery({ 
      queryKey: ['focused-trends'], 
      // Default to UTC on server. Client will refetch if timezone differs.
      queryFn: () => getProductiveHours(profile, 'UTC') 
    }),
    queryClient.prefetchQuery({ 
      queryKey: ['recent-sessions'], 
      queryFn: () => getRecentTimes(profile) 
    }),
    queryClient.prefetchQuery({ 
      queryKey: ['friends'], 
      queryFn: () => getFriendsStats(profile) 
    }),
    queryClient.prefetchQuery({ 
      queryKey: ['friendRequests'], 
      queryFn: () => getFriendRequests(profile) 
    }),
    queryClient.prefetchQuery({ 
      queryKey: ['todos'], 
      queryFn: () => getTodos(profile) 
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  );
}
