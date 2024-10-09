'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion'; // For animations

const JournalPage = () => {
  const [dates, setDates] = useState<string[]>([
    '2024-10-01',
    '2024-10-05',
    '2024-10-08',
    '2024-10-09', // Add more dates as needed
  ]);

  const [selectedEmoji, setSelectedEmoji] = useState({
    mood: null,
    sleep: null,
    nutrition: null,
  });

  // Dummy entries for journal
  const journalEntries = [
    {
      date: '2024-10-01',
      text: 'Had a productive day working on the new journaling feature. Finished the timer component as well!',
    },
    {
      date: '2024-10-05',
      text: 'Slow progress today due to lack of sleep. The design feels like it’s coming together though.',
    },
    {
      date: '2024-10-08',
      text: 'Feeling great today. Everything is working as expected and I’m happy with the layout.',
    },
    {
      date: '2024-10-09',
      text: 'Finishing up the journal page today. It looks so much better now!',
    },
  ];

  const handleEmojiClick = (type: string, value: number) => {
    setSelectedEmoji((prevState) => ({
      ...prevState,
      [type]: value,
    }));
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar/Scrollbar Timeline */}
      <div className="relative w-4 hover:w-20 transition-all duration-300 ease-in-out bg-black hover:bg-gray-900 overflow-hidden">
        <div className="absolute bottom-0 w-full text-center text-sm text-white mb-2">
          {dates[dates.length - 1]}
        </div>
        <div className="absolute bottom-0 w-full flex flex-col-reverse h-full p-2">
          {dates.map((date, index) => (
            <motion.div
              key={index}
              className="mb-4 text-xs text-white hover:text-blue-400 transition-all cursor-pointer opacity-80 hover:scale-110"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {/* Add logic to scroll to journal entry */}}
            >
              {date}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Journal Entries Area */}
      <div className="flex-1 bg-gray-800 p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Journal</h1>
        {journalEntries.map((entry, index) => (
          <motion.div
            key={index}
            className="p-6 bg-gray-800 rounded-lg shadow-lg mb-8 border-gray-700"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <h2 className="text-xl text-white mb-4">{entry.date}</h2>
            <p className="text-sm text-gray-300 mb-4">
              {entry.text.length > 250 ? entry.text.slice(0, 250) + '...' : entry.text}
            </p>
            <div className="flex space-x-4 items-center">
              {/* Emoji Buttons */}
              <button
                className={`text-2xl ${selectedEmoji.mood ? 'scale-125' : ''}`}
                onClick={() => handleEmojiClick('mood', selectedEmoji.mood ? 0 : 1)}
              >
                {selectedEmoji.mood ? '😊' : '😐'}
              </button>
              <button
                className={`text-2xl ${selectedEmoji.sleep ? 'scale-125' : ''}`}
                onClick={() => handleEmojiClick('sleep', selectedEmoji.sleep ? 0 : 1)}
              >
                {selectedEmoji.sleep ? '😴' : '🛌'}
              </button>
              <button
                className={`text-2xl ${selectedEmoji.nutrition ? 'scale-125' : ''}`}
                onClick={() => handleEmojiClick('nutrition', selectedEmoji.nutrition ? 0 : 1)}
              >
                {selectedEmoji.nutrition ? '🍏' : '🍔'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Emoji Selector Modal */}
      {/* If required, implement a modal for selecting ratings */}
    </div>
  );
};

export default JournalPage;
