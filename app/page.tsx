import { Suspense } from "react";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { Pronounce } from "./Pronounce";

export default function Search({
  searchParams,
}: {
  searchParams: Promise<{
    query: string;
  }>;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center p-4 sm:p-24 bg-gradient-to-b from-amber-50 to-white">
      <div className="w-full max-w-2xl px-2 sm:px-0">
        <h1 className="text-3xl sm:text-4xl font-serif text-gray-800 mb-6 sm:mb-8 text-center">
          𝒻𝒶𝓈𝓉 Dictionary
        </h1>
        <SearchBar />
        <Suspense>
          <SearchContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

// ************* Shared *************
const ELIPSIS = <p className="text-gray-600">...</p>;

// ************* Search Bar *************
const SearchBar = () => {
  return (
    <form action="/" className="mb-4 sm:mb-6">
      <div className="flex gap-2">
        <input
          autoFocus
          type="text"
          name="query"
          placeholder="Look up a word/phrase..."
          className="flex-1 rounded-lg border border-gray-300 px-4 sm:px-6 py-2 sm:py-3 bg-white text-gray-800 placeholder-gray-500 shadow-sm transition-all duration-200 hover:border-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none font-serif text-base sm:text-lg"
        />
      </div>
    </form>
  );
};

// ************* Search Content *************
const SearchContent = async ({
  searchParams,
}: {
  searchParams: Promise<{ query: string }>;
}) => {
  const { query } = await searchParams;
  if (!query) {
    return null;
  }
  return (
    <div className="rounded-lg border border-gray-200 p-4 sm:p-6 bg-white shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-serif text-gray-800 line-clamp-1">
          {query}
        </h2>
        <Pronounce word={query} />
      </div>
      <RenderSearch query={query} />
    </div>
  );
};

const RenderSearch = async ({ query }: { query: string }) => {
  const reader = await (
    await streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: `Provide the Chinese translation and a brief definition. Keep it short and clear. For hard words in the definition, include their Chinese translation in brackets next to the word. Write each on two new lines.
          
          Input: dictionary
          Output:
          字典
          
          A dictionary is a reference book that lists words in alphabetical order (字母顺序) and provides their meanings, pronunciations, and other information.
          `,
        },
        {
          role: "user",
          content: `Look up: ${query}`,
        },
      ],
    }).textStream
  ).getReader();

  return (
    <Suspense fallback={ELIPSIS}>
      <RenderStream reader={reader} />
    </Suspense>
  );
};

const RenderStream = async ({
  reader,
}: {
  reader: ReadableStreamDefaultReader<string>;
}) => {
  const { done, value } = await reader.read();

  if (done) {
    return null;
  }

  return (
    <>
      <span className="text-gray-700 text-base sm:text-lg whitespace-pre-wrap font-serif leading-relaxed">
        {value}
      </span>
      <Suspense fallback={ELIPSIS}>
        <RenderStream reader={reader} />
      </Suspense>
    </>
  );
};
