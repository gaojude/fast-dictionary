import { Suspense } from "react";
import { openai } from "@ai-sdk/openai";
import {
  streamText,
  experimental_generateImage as generateImage,
  generateText,
} from "ai";
import { Pronounce } from "./Pronounce";
import { cacheLife } from "next/dist/server/use-cache/cache-life";
import Link from "next/link";
import { ErrorBoundary } from "./error-boundary";
type ISearchParams = Promise<{
  query: string | undefined;
}>;

export default function Search({
  searchParams,
}: {
  searchParams: ISearchParams;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center p-4 sm:p-24 bg-gradient-to-b from-amber-50 to-white">
      <div className="w-full max-w-2xl px-2 sm:px-0">
        <h1 className="text-3xl sm:text-4xl font-serif text-gray-800 mb-6 sm:mb-8 text-center">
          <Link href="/">𝒻𝒶𝓈𝓉 Dictionary</Link>
        </h1>
        <SearchBar />
        <Suspense>
          <SearchHeader searchParams={searchParams} />
        </Suspense>

        <ErrorBoundary
          fallback={<div>Something went wrong. Please try again.</div>}
        >
          <Suspense>
            <SearchContent searchParams={searchParams} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

// ************* Meta Data *************
export const generateMetadata = async ({
  searchParams,
}: {
  searchParams: ISearchParams;
}) => {
  const { query } = await searchParams;
  return {
    title: query
      ? `${query?.slice(0, 30)}${
          query?.length > 30 ? "..." : ""
        } - 𝒻𝒶𝓈𝓉 Dictionary`
      : "𝒻𝒶𝓈𝓉 Dictionary",
  };
};

// ************* Shared *************
const ELIPSIS = <p className="text-gray-600">...</p>;

// Safari buffers the first 1KB of content, so we need to add invisible characters to force it to flush the initial buffering
const SafariInitialBufferFix = () => {
  return <>{"\u200b".repeat(1024)}</>;
};

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

const SearchHeader = async ({
  searchParams,
}: {
  searchParams: ISearchParams;
}) => {
  const { query } = await searchParams;
  if (!query) {
    return null;
  }
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl font-serif text-gray-800 line-clamp-1">
        {query}
      </h2>
      <Pronounce input={query} />
    </div>
  );
};

// ************* Search Content *************
const SearchContent = async ({
  searchParams,
}: {
  searchParams: ISearchParams;
}) => {
  const { query } = await searchParams;
  if (!query) {
    return null;
  }
  return (
    <div className="rounded-lg border border-gray-200 p-4 sm:p-6 bg-white shadow-md">
      <RenderSearch query={query} />
      <RenderImage query={query} />
    </div>
  );
};

const RenderSearch = async ({ query }: { query: string }) => {
  "use cache";
  cacheLife("max");

  const reader = await (
    await streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: `Provide the Chinese translation and a brief definition. Keep it short and clear. For hard words in the definition, include their Chinese translation in brackets next to the word. Write each on two new lines. If the input is a sentence, output the sentence and its Chinese translation. If the sentence has a word marked with a star, provide its definition and translation as a separate line.
          
          Example 1:
          Input: dictionary
          Output:
          字典
          
          A dictionary is a reference book that lists words in alphabetical order (字母顺序) and provides their meanings, pronunciations (发音), and other information.

          Example 2:
          Input: At least for now, few believe that Mr Trump’s long-professed desire for a weaker dollar, to boost American exports, has much chance of being realised.
          Output:
          At least for now, few believe that Mr Trump’s long-professed desire for a weaker dollar, to boost American exports, has much chance of being realised.
          
          至少目前，很少有人相信特朗普长期宣称的通过美元贬值来提振美国出口的愿望有很大机会实现。

          Example 3:
          Input: The further our cause* advances
          Output:
          The further our cause advances

          我们的事业越向前推进
          course (事业): A principle, goal, or movement that people support or are working toward.

          Example 4:
          Input: *not least* in the European Union
          Output:
          not least in the European Union

          在欧盟中，尤其重要。
          not least (尤其重要): At least as important as anything else.
          `,
        },
        {
          role: "user",
          content: query,
        },
      ],
    }).textStream
  ).getReader();

  return (
    <Suspense
      fallback={
        <>
          <SafariInitialBufferFix />
          {ELIPSIS}
        </>
      }
    >
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

const GenerateImage = async ({ query }: { query: string }) => {
  "use cache";
  cacheLife("max");
  const { text: imagePrompt } = await generateText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: `Write a concise, optimized DALL-E v2 prompt for: ${query}`,
      },
    ],
  });

  try {
    const { image } = await generateImage({
      model: openai.image("dall-e-2"),
      prompt: imagePrompt,
      size: "512x512",
      n: 1,
    });

    return (
      <img
        src={`data:image/png;base64,${image.base64}`}
        alt={imagePrompt}
        className="mt-4 w-full h-[100%] aspect-square"
      />
    );
  } catch (error) {
    return (
      <div className="w-full h-[100%] aspect-square bg-gray-100 flex items-center justify-center mt-4">
        <div className="text-red-500">
          Failed to generate image. Please try again.
          <br />
          Error: {JSON.stringify({ error, imagePrompt })}
        </div>
      </div>
    );
  }
};

const RenderImage = async ({ query }: { query: string }) => {
  return (
    <Suspense
      fallback={
        <div className="w-full h-[100%] aspect-square bg-gray-100 flex items-center justify-center mt-4">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 rounded-full border-t-gray-600" />
        </div>
      }
    >
      <GenerateImage query={query} />
    </Suspense>
  );
};
