"use client";

import { useRef } from "react";

interface PronounceProps {
  word: string;
}

export function Pronounce({ word }: PronounceProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePronounce = async () => {
    try {
      const speech = new SpeechSynthesisUtterance(word);
      speech.lang = "en-US";
      window.speechSynthesis.speak(speech);
    } catch (error) {
      console.error("Error pronouncing word:", error);
    }
  };

  return (
    <button
      onClick={handlePronounce}
      className="inline-flex items-center px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
      aria-label={`Pronounce ${word}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4 mr-1"
      >
        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
      </svg>
      Pronounce
    </button>
  );
}
