'use client'

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AiOutlinePlus } from 'react-icons/ai';
import { IoMdClose } from 'react-icons/io';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css'; 
import Navbar from '@/components/navbar';

interface JournalEntry {
  id: string;
  created_at: string;
  entry: string;
  mood: number;
  nutrition: number;
  sleep: number;
}

interface NewJournalEntry {
  entry: string;
  mood: number;
  sleep: number;
  nutrition: number;
}

const JournalPage: React.FC = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState<string>('');
  const [mood, setMood] = useState<number>(3);
  const [sleep, setSleep] = useState<number>(3);
  const [nutrition, setNutrition] = useState<number>(3);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [skip, setSkip] = useState<number>(0);
  const [hasMoreEntries, setHasMoreEntries] = useState<boolean>(true); 
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchJournals();
  }, []);

  useEffect(() => {
    if (!bottomRef.current || !hasMoreEntries || isFetching) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isFetching) {
        setTimeout(() => {
          fetchJournals(skip);
        }, 500);  // delay of 500ms to prevent multiple rapid calls
      }
    }, { threshold: 1 });

    observer.observe(bottomRef.current);

    return () => {
      if (bottomRef.current) observer.unobserve(bottomRef.current);
    };
  }, [skip, isFetching, hasMoreEntries]);


  const fetchJournals = async (skip = 0) => {
    if (!hasMoreEntries || isFetching) return; 

    try {
      setIsFetching(true);
      const response = await axios.get(`/api/journal?skip=${skip}&take=20`);
      console.log(response);
      
      if (response.data.length === 0) {
        setHasMoreEntries(false); 
      } else {
        setJournalEntries(prev => {
          const newEntries = response.data.filter(
            (newEntry: JournalEntry) => !prev.some(entry => entry.id === newEntry.id)
          );
          return [...prev, ...newEntries];
        });
        setSkip(prev => prev + 20); 
      }
    } catch (error) {
      console.error('Error fetching journals:', error);
    } finally {
      setIsFetching(false);
    }
  };


  const handlePostJournal = async () => {
    try {
      const newJournal: NewJournalEntry = {
        entry: newEntry,
        mood,
        sleep,
        nutrition,
      };
      const response = await axios.post<JournalEntry>('/api/journal', newJournal);
      setJournalEntries([response.data, ...journalEntries]);
      setNewEntry('');
      setMood(3);
      setSleep(3);
      setNutrition(3);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error posting journal:', error);
    }
  };

  const renderModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 p-8 rounded-lg shadow-lg w-96 relative"
      >
        <IoMdClose 
          className="absolute top-2 right-2 text-gray-600 cursor-pointer"
          onClick={() => setIsModalOpen(false)}
          size={24}
        />
        <h2 className="text-2xl mb-4 font-semibold">New Journal Entry</h2>
        <ReactQuill 
          value={newEntry} 
          onChange={setNewEntry} 
          placeholder="Write your thoughts here..." 
          className="mb-4"
        />
        <div className="mb-4">
          <label className="block text-sm mb-2">Mood</label>
          <input 
            type="range" 
            min="1" 
            max="5" 
            value={mood} 
            onChange={e => setMood(Number(e.target.value))} 
            className="w-full" 
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-2">Sleep</label>
          <input 
            type="range" 
            min="1" 
            max="5" 
            value={sleep} 
            onChange={e => setSleep(Number(e.target.value))} 
            className="w-full" 
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm mb-2">Nutrition</label>
          <input 
            type="range" 
            min="1" 
            max="5" 
            value={nutrition} 
            onChange={e => setNutrition(Number(e.target.value))} 
            className="w-full" 
          />
        </div>
        <button 
          onClick={handlePostJournal} 
          className="bg-blue-500 text-white w-full py-2 rounded-md"
        >
          Save Journal
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      <Navbar/>
      <div className="flex-1 mt-12 p-6 overflow-y-auto relative">
        {/* <h1 className="text-3xl font-bold text-white mb-8">Journal</h1> */}
        {journalEntries.map((entry, index) => (
          <motion.div
            key={index}
            className="p-6 bg-gray-800 rounded-lg shadow-lg mb-8 border-gray-700"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <h2 className="text-xl text-white mb-4">{new Date(entry.created_at).toLocaleDateString()}</h2>
            <div 
              dangerouslySetInnerHTML={{ __html: entry.entry }} 
              className="text-sm text-gray-300 mb-4"
            ></div>
            <div className="flex space-x-4 text-gray-400">
              <span>Mood: {entry.mood}</span>
              <span>Sleep: {entry.sleep}</span>
              <span>Nutrition: {entry.nutrition}</span>
            </div>
          </motion.div>
        ))}
        
        {isFetching && <div className="text-center text-white mt-4">Loading more entries...</div>}
        <div ref={bottomRef} className="h-10"></div>
      </div>

      <motion.button
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700"
        whileHover={{ scale: 1.1 }}
        onClick={() => setIsModalOpen(true)}
      >
        <AiOutlinePlus size={28} />
      </motion.button>

      {isModalOpen && renderModal()}
    </div>
  );
};

export default Journal;