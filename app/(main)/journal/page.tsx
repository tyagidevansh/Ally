'use client'

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AiOutlinePlus } from 'react-icons/ai';
import { IoMdClose } from 'react-icons/io';
import { FaBed, FaCarrot, FaSmile } from 'react-icons/fa';
import Navbar from '@/components/navbar';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [skip, setSkip] = useState<number>(0);
  const [hasMoreEntries, setHasMoreEntries] = useState<boolean>(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const journalEntriesRef = useRef(new Set<string>());

  const getColor = (rating: number) => {
    if (rating <= 2) return 'text-red-500';
    if (rating === 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const groupEntriesByDate = () => {
    const groupedEntries: { [key: string]: JournalEntry[] } = {};
    journalEntries.forEach(entry => {
      const formattedDate = formatDate(entry.created_at);
      if (!groupedEntries[formattedDate]) {
        groupedEntries[formattedDate] = [];
      }
      groupedEntries[formattedDate].push(entry);
    });
    return groupedEntries;
  };

  const handleEmojiClick = (setter: React.Dispatch<React.SetStateAction<number>>, currentValue: number) => {
    const newValue = currentValue === 5 ? 1 : currentValue + 1;
    setter(newValue);
  };

  const fetchJournals = async (skip = 0) => {
    if (!hasMoreEntries) return;

    try {
      const response = await axios.get(`/api/journal?skip=${skip}&take=20`);
      const newEntries = response.data;

      const uniqueEntries = newEntries.filter(
        (newEntry: JournalEntry) => !journalEntriesRef.current.has(newEntry.id)
      );

      if (uniqueEntries.length === 0) {
        setHasMoreEntries(false);
      } else {
        setJournalEntries(prev => [...prev, ...uniqueEntries]);

        uniqueEntries.forEach((entry: { id: string; }) => journalEntriesRef.current.add(entry.id));

        setSkip(prev => prev + 20);
      }
    } catch (error) {
      console.error('Error fetching journals:', error);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  useEffect(() => {
    if (!bottomRef.current || !hasMoreEntries) return;

    let fetching = false; 

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !fetching) {
        fetching = true;  
        setTimeout(() => {
          fetchJournals(skip).finally(() => {
            fetching = false;  
          });
        }, 500);
      }
    }, { threshold: 1 });

    observer.observe(bottomRef.current);

    return () => {
      if (bottomRef.current) observer.unobserve(bottomRef.current);
    };
  }, [skip, hasMoreEntries]);


  const handlePostJournal = async () => {
    setIsSaving(true);
    try {
      const newJournal: NewJournalEntry = {
        entry: newEntry,
        mood,
        sleep,
        nutrition,
      };
      const response = await axios.post<JournalEntry>('/api/journal', newJournal);

      setJournalEntries(prev => [response.data, ...prev.filter(entry => entry.id !== response.data.id)]);
      setNewEntry('');
      setMood(3);
      setSleep(3);
      setNutrition(3);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error posting journal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-3xl relative flex flex-col"
        style={{ maxHeight: '80vh' }}
      >
        <IoMdClose
          className="absolute top-2 right-2 text-gray-600 dark:text-gray-300 cursor-pointer"
          onClick={() => setIsModalOpen(false)}
          size={24}
        />
        <h2 className="text-2xl mb-4 font-semibold text-gray-800 dark:text-gray-300">New Journal Entry</h2>

        <ReactQuill
          value={newEntry}
          onChange={setNewEntry}
          placeholder="Write your thoughts here..."
          className="mb-4 flex-1 overflow-y-auto"
          style={{ maxHeight: '50vh' }}
          modules={{
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ 'header': '1' }, { 'header': '2' }],
              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
              [{ 'indent': '-1' }, { 'indent': '+1' }],
              [{ 'align': [] }],
            ]
          }}
        />

        <div className="flex justify-around items-center mb-4 space-x-6">
          <div className="flex items-center space-x-2 cursor-pointer"
               onClick={() => handleEmojiClick(setMood, mood)}
               title="Rate your mood"
          >
            <span className="text-3xl"></span>
            <span className={`text-lg ${getColor(mood)}`}>{mood}</span>
          </div>
          <div className="flex items-center space-x-2 cursor-pointer"
               onClick={() => handleEmojiClick(setSleep, sleep)}
               title="Rate your sleep"
          >
            <FaBed size={28} className="text-blue-500"/>
            <span className={`text-lg ${getColor(sleep)}`}>{sleep}</span>
          </div>
          <div className="flex items-center space-x-2 cursor-pointer"
               onClick={() => handleEmojiClick(setNutrition, nutrition)}
               title="Rate your nutrition"
          >
            <FaCarrot size={28} className="text-orange-400"/>
            <span className={`text-lg ${getColor(nutrition)}`}>{nutrition}</span>
          </div>
        </div>

        <button
          onClick={handlePostJournal}
          className="bg-green-500 text-white w-full py-2 rounded-md hover:bg-green-600 transition duration-300"
        >
          {isSaving ? 'Saving...' : 'Save Journal'}
        </button>
      </motion.div>
    </div>
  );

  const groupedEntries = groupEntriesByDate();

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar showToggle = {true} />
      <div className="overflow-auto p-6">
        {Object.entries(groupedEntries).map(([date, entries]) => (
          <div key={date}>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">{date}</h2>
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md mb-4 border-l-4 border-green-500"
              >
                <div dangerouslySetInnerHTML={{ __html: entry.entry }} className="prose prose-lg dark:prose-dark" />
                <div className="mt-4 flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="mr-2">Mood:</span>
                    <span className={`text-xl ${getColor(entry.mood)}`}></span>
                    <span className={`ml-2 text-lg ${getColor(entry.mood)}`}>{entry.mood}</span>
                  </div>
                  <div>
                    <span className="mr-2">Sleep:</span>
                    <FaBed size={20} className={`inline ${getColor(entry.sleep)}`} />
                    <span className={`ml-2 text-lg ${getColor(entry.sleep)}`}>{entry.sleep}</span>
                  </div>
                  <div>
                    <span className="mr-2">Nutrition:</span>
                    <FaCarrot size={20} className={`inline ${getColor(entry.nutrition)}`} />
                    <span className={`ml-2 text-lg ${getColor(entry.nutrition)}`}>{entry.nutrition}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition duration-300"
      >
        <AiOutlinePlus size={32} />
      </button>

      {isModalOpen && renderModal()}
    </div>
  );
};

export default JournalPage;