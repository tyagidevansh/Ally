'use client';

import React, { useState } from 'react';
import { UserPlus, Check, X, Clock, Target, Flame, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface FriendStat {
  id: string;
  name: string;
  email: string;
  focusedTimeToday: number;
  goalsHitToday: number;
  streak: number;
  isFocusing: boolean;
}

interface FriendRequest {
  id: string;
  senderName: string;
  senderEmail: string;
}

const FriendsStats = () => {
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState('');
  const [addMessage, setAddMessage] = useState({ text: '', type: '' });
  
  // Track which friend is being reacted to
  const [activeReaction, setActiveReaction] = useState<{ id: string, type: 'CHEER' | 'SNEER' } | null>(null);
  const [reactionMessage, setReactionMessage] = useState('');
  const [isSendingReaction, setIsSendingReaction] = useState(false);

  const { data: friends = [], isLoading: isLoadingFriends } = useQuery<FriendStat[]>({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await fetch('/api/friends/stats', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch friends');
      return res.json();
    },
    refetchInterval: 15 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });

  const { data: pendingRequests = [], isLoading: isLoadingRequests } = useQuery<FriendRequest[]>({
    queryKey: ['friendRequests'],
    queryFn: async () => {
      const res = await fetch('/api/friends/requests', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch requests');
      return res.json();
    },
    refetchInterval: 15 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });

  const loading = isLoadingFriends || isLoadingRequests;

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: searchEmail }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setAddMessage({ text: 'Friend request sent!', type: 'success' });
        setSearchEmail('');
      } else {
        setAddMessage({ text: data.error || 'Failed to send request.', type: 'error' });
      }
      
      setTimeout(() => setAddMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setAddMessage({ text: 'An error occurred.', type: 'error' });
    }
  };

  const handleRespondRequest = async (requestId: string, accept: boolean) => {
    try {
      const res = await fetch('/api/friends/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, accept }),
      });
      
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
        if (accept) {
          queryClient.invalidateQueries({ queryKey: ['friends'] });
        }
      }
    } catch (error) {
      console.error('Failed to respond to friend request:', error);
    }
  };

  const handleSendReaction = async (friendId: string) => {
    if (!activeReaction || !reactionMessage.trim()) return;
    
    setIsSendingReaction(true);
    try {
      const res = await fetch('/api/friends/cheer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friendId,
          type: activeReaction.type,
          message: reactionMessage.trim().substring(0, 100)
        }),
      });

      if (res.ok) {
        // Success feedback could go here, for now just close
        setActiveReaction(null);
        setReactionMessage('');
      }
    } catch (error) {
      console.error('Failed to send reaction:', error);
    } finally {
      setIsSendingReaction(false);
    }
  };

  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="h-full w-full flex flex-col relative">
      <h2 className="text-green-500 font-bold mb-4 text-xl">Friends Stats</h2>
      
      {/* Friend Request Popup - appears over this component if there are pending requests */}
      {pendingRequests.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-yellow-500 p-6 rounded-xl shadow-2xl max-w-md w-full relative">
            <h3 className="font-bold text-yellow-500 text-xl mb-4 text-center">New Friend Request!</h3>
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between bg-gray-900 p-3 rounded-lg mb-3 border border-gray-700">
                <div>
                  <span className="block font-medium text-gray-100">{req.senderName}</span>
                  <span className="text-xs text-gray-400">{req.senderEmail}</span>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleRespondRequest(req.id, true)}
                    className="p-2 bg-green-500/20 text-green-500 rounded hover:bg-green-500/40 transition"
                    title="Accept"
                  >
                    <Check size={20} />
                  </button>
                  <button 
                    onClick={() => handleRespondRequest(req.id, false)}
                    className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500/40 transition"
                    title="Decline"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Friend Form */}
      <form onSubmit={handleSendRequest} className="mb-4 flex items-center space-x-2">
        <input
          type="email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          placeholder="Add friend by email"
          className="border p-2 rounded flex-grow bg-gray-800 border-gray-700 outline-none focus:border-green-500 text-sm"
        />
        <button type="submit" className="bg-gray-800 border border-gray-700 p-2 rounded hover:bg-gray-700 transition">
          <UserPlus className="text-green-500 w-5 h-5" />
        </button>
      </form>
      
      {addMessage.text && (
        <p className={`text-xs mb-4 ${addMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
          {addMessage.text}
        </p>
      )}

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        {loading ? (
          <p className="text-sm text-gray-400">Loading friends...</p>
        ) : friends.length === 0 ? (
          <p className="text-sm text-gray-400">No friends added yet. Start by sending a request!</p>
        ) : (
          <div className="space-y-3">
            {friends.map(friend => (
              <div key={friend.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-100">{friend.name}</h4>
                  <div className="flex items-center gap-2">
                    {friend.isFocusing && (
                      <>
                        <button 
                          onClick={() => setActiveReaction({ id: friend.id, type: 'CHEER' })}
                          className="p-1.5 rounded bg-green-500/10 hover:bg-green-500/30 text-green-500 transition-colors"
                          title="Send a cheer!"
                        >
                          🎉
                        </button>
                        <button 
                          onClick={() => setActiveReaction({ id: friend.id, type: 'SNEER' })}
                          className="p-1.5 rounded bg-orange-500/10 hover:bg-orange-500/30 text-orange-500 transition-colors"
                          title="Send a sneer!"
                        >
                          😈
                        </button>
                        <span className="bg-green-500/20 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                          Focusing
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Reaction Form */}
                {activeReaction?.id === friend.id && (
                  <div className="mb-3 p-2 bg-gray-900 rounded-lg border border-gray-700/80 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold" style={{ color: activeReaction.type === 'CHEER' ? '#4ade80' : '#fb923c' }}>
                        {activeReaction.type === 'CHEER' ? 'Cheering' : 'Sneering'} at {friend.name}
                      </span>
                      <button onClick={() => setActiveReaction(null)} className="text-gray-500 hover:text-gray-300 p-0.5">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={reactionMessage}
                        onChange={(e) => setReactionMessage(e.target.value)}
                        placeholder="Write a short message..."
                        maxLength={100}
                        className="flex-1 bg-gray-800 text-sm px-2 py-1.5 rounded border border-gray-700 focus:outline-none focus:border-green-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendReaction(friend.id);
                        }}
                      />
                      <button 
                        onClick={() => handleSendReaction(friend.id)}
                        disabled={!reactionMessage.trim() || isSendingReaction}
                        className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex flex-col items-center justify-center p-2 bg-gray-900 rounded border border-gray-700/50">
                    <Clock size={14} className="text-blue-400 mb-1" />
                    <span className="font-medium text-gray-300">{formatDuration(friend.focusedTimeToday)}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 bg-gray-900 rounded border border-gray-700/50">
                    <Target size={14} className="text-yellow-400 mb-1" />
                    <span className="font-medium text-gray-300">{friend.goalsHitToday} Goals</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 bg-gray-900 rounded border border-gray-700/50">
                    <Flame size={14} className="text-orange-500 mb-1" />
                    <span className="font-medium text-gray-300">{friend.streak} Days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsStats;
