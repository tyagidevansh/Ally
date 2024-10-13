'use client'

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AiOutlinePlus } from 'react-icons/ai';
import { IoMdClose } from 'react-icons/io';
import { FaBed, FaCarrot, FaSmile } from 'react-icons/fa';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import Navbar from '@/components/navbar';
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';
import { Calendar as CalendarIcon, Divide } from 'lucide-react';

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [noEntries, setNoEntries] = useState<boolean>(false);

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
    setLoading(true);
    
    if (!hasMoreEntries && !selectedDate) return;

    try {
      let url = `/api/journal?skip=${skip}&take=20`;
      if (selectedDate) {
        const formattedDate = selectedDate.toLocaleDateString('en-CA');
        url = `/api/journal?date=${formattedDate}`;
      }
      const response = await axios.get(url);
      const newEntries = response.data;

      const uniqueEntries = newEntries.filter(
        (newEntry: JournalEntry) => !journalEntriesRef.current.has(newEntry.id)
      );

      setLoading(false);

      if (uniqueEntries.length === 0) {
        setHasMoreEntries(false);
      } else {
        setJournalEntries(prev => selectedDate ? uniqueEntries : [...prev, ...uniqueEntries]);
        uniqueEntries.forEach((entry: { id: string; }) => journalEntriesRef.current.add(entry.id));
        if (!selectedDate) {
          setSkip(prev => prev + 20);
        }
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

  useEffect(() => {
    if (selectedDate) {
      fetchJournals();
    }
  }, [selectedDate]);

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
    
      if (response.status === 201) {
        setJournalEntries(prev => [{id: "", created_at: new Date().toISOString(), profileId: "", entry: newEntry, mood: mood, sleep: sleep, nutrition: nutrition}, ...prev.filter(entry => entry.id !== response.data.id)]);
        setNewEntry('');
        setMood(3);
        setSleep(3);
        setNutrition(3);
        setIsModalOpen(false);
      }
      
    } catch (error) {
      console.error('Error posting journal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateSelect = (date : Date | undefined) => {
    setJournalEntries([]);
    journalEntriesRef.current.clear();
    setSelectedDate(date);
  }

  const handleResetFilter = () => {
    setSelectedDate(undefined);
    setJournalEntries([]);
    journalEntriesRef.current.clear();
    setSkip(0);
    setHasMoreEntries(true);
  }

  const groupedEntries = groupEntriesByDate();

  return (
    <div className="flex flex-col min-h-screen max-w-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-950 dark:to-gray-800">
      <Navbar showToggle={true} />
      <div className="p-6 mt-10">
        <div className="flex justify-between items-center mb-10">
          <div className="relative">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-green-800 dark:from-green-500 dark:to-green-300">
              Your Journal
            </h1>
            <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-800 dark:from-green-500 dark:to-green-300"></div>
          </div>
          <div className="flex space-x-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-green-600 text-green-700 dark:text-green-300 dark:border-green-500 hover:bg-green-50 dark:hover:bg-gray-800">
                  {selectedDate ? format(selectedDate, "PPP") : (<CalendarIcon/>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-700 shadow-lg" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {selectedDate && (
              <Button 
                onClick={handleResetFilter} 
                variant="outline" 
                className='text-red-500 hover:bg-red-50 dark:bg-gray-700 dark:text-red-400 dark:hover:bg-gray-600'>
                Reset Filter
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-auto">
          {loading && (<div className='font-xl align-middle text-center'> Loading... </div>)}
          
          {Object.keys(groupedEntries).length === 0 ? (
            !loading && (
              <div className='font-xxl align-middle text-center text-green-400'>
              No journal entries yet! Make one to start your journey.
              </div>
            )
          ) : (
            Object.entries(groupedEntries).map(([date, entries]) => (
            <div key={date}>
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-500 mb-4">{date}</h2>
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-6 border-l-4 border-green-500 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-60"
                >
                  <div 
                    dangerouslySetInnerHTML={{ __html: entry.entry }} 
                    className="prose prose-lg max-w-none dark:prose-invert dark:text-gray-200" 
                  />
                  <div className="mt-4 flex items-center text-gray-700 dark:text-gray-300">
                    <div className='mr-4'>
                      <FaSmile size={24} className={`inline ${getColor(entry.mood)}`} />
                      <span className={`ml-2 text-lg ${getColor(entry.mood)}`}>{entry.mood}</span>
                    </div>
                    <div className='mr-4'>
                      <FaBed size={24} className={`inline ${getColor(entry.sleep)}`} />
                      <span className={`ml-2 text-lg ${getColor(entry.sleep)}`}>{entry.sleep}</span>
                    </div> 
                    <div className='mr-4'>
                      <FaCarrot size={24} className={`inline ${getColor(entry.nutrition)}`} />
                      <span className={`ml-2 text-lg ${getColor(entry.nutrition)}`}>{entry.nutrition}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )))}
          <div ref={bottomRef} />
        </div>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition duration-300 z-10"
      >
        <AiOutlinePlus size={32} />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-3xl relative flex flex-col"
            style={{ maxHeight: '80vh', height: '80vh' }}
          >
            <IoMdClose
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 cursor-pointer hover:text-red-500 dark:hover:text-red-400"
              onClick={() => setIsModalOpen(false)}
              size={28}
            />
            <h2 className="text-3xl mb-6 font-semibold text-green-700 dark:text-green-500">New Journal Entry</h2>

            <div className="flex-1 overflow-y-auto max-h-[50vh]">
              <ReactQuill
                value={newEntry}
                onChange={setNewEntry}
                className="mb-6 dark:text-white"
                placeholder="Write your thoughts here..."
                style={{ height: '40vh' }}
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'header': '1' }, { 'header': '2' }],
                    [{ color: [] }],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'indent': '-1' }, { 'indent': '+1' }],
                    [{ 'align': [] }],
                  ],
                }}
              />
            </div>

            <div className="flex items-center mb-6 space-x-12">
              <div className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => handleEmojiClick(setMood, mood)}
                  title="Rate your mood"
              >
                <FaSmile size={32} className="text-yellow-500"/>
                <span className={`text-xl ${getColor(mood)}`}>{mood}</span>
              </div>
              <div className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => handleEmojiClick(setSleep, sleep)}
                  title="Rate your sleep"
              >
                <FaBed size={32} className="text-blue-500"/>
                <span className={`text-xl ${getColor(sleep)}`}>{sleep}</span>
              </div>
              <div className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => handleEmojiClick(setNutrition, nutrition)}
                  title="Rate your nutrition"
              >
                <FaCarrot size={32} className="text-orange-400"/>
                <span className={`text-xl ${getColor(nutrition)}`}>{nutrition}</span>
              </div>
            </div>

            <button
              onClick={handlePostJournal}
              className="bg-green-500 text-white w-full py-3 rounded-md hover:bg-green-600 transition duration-300 text-lg font-semibold"
            >
              {isSaving ? 'Saving...' : 'Save Journal'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default JournalPage;