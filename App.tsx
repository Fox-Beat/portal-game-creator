
import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Header } from './components/Header';
import { TextInputArea } from './components/TextInputArea';
import { ActionButton } from './components/ActionButton';
import { DataTable } from './components/DataTable';
import { ProcessIcon } from './components/icons/ProcessIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { TableIcon } from './components/icons/TableIcon';
import { ClearIcon } from './components/icons/ClearIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { ProcessedGameData, GameProviderFolderMapping } from './types';
import { GAME_PROVIDER_TO_FOLDER_MAP_CA, GAME_PROVIDER_TO_FOLDER_MAP_COM, APP_TITLE, OUTPUT_CSV_COLUMNS, PLACEHOLDER_INFO_REQUIRED_COLUMNS } from './constants';
import { parsePastedData, generateCsvContent } from './services/dataProcessor';
import { ApiKeyInput } from './components/ApiKeyInput';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [processedData, setProcessedData] = useState<ProcessedGameData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnriching, setIsEnriching] = useState<boolean>(false);

  const handleProcessData = useCallback(async (providerMapToUse: GameProviderFolderMapping, context: string) => {
    if (!rawText.trim()) {
      setError("Input data cannot be empty.");
      setProcessedData([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    setProcessedData([]); // Clear previous results

    console.log(`Processing for context: ${context} using map:`, providerMapToUse);

    try
    {
      await new Promise(resolve => setTimeout(resolve, 100)); 
      const data = parsePastedData(rawText, providerMapToUse);
      setProcessedData(data);
      if (data.length === 0 && !error) { 
         setError("No valid data rows found or core required headers are missing. " + PLACEHOLDER_INFO_REQUIRED_COLUMNS);
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(`Error processing data: ${e.message}`);
      } else {
        setError("An unknown error occurred during processing.");
      }
      setProcessedData([]);
    } finally {
      setIsLoading(false);
    }
  }, [rawText, error]); // error is a dependency because it's checked in the if condition

  const handleEnrichData = useCallback(async () => {
    if (!apiKey.trim()) {
      setError("Please enter a valid Gemini API key to use the AI enrichment feature.");
      return;
    }
    if (processedData.length === 0) {
      setError("No data to enrich.");
      return;
    }
    setIsEnriching(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          gameType: { type: Type.STRING, description: "Game category (e.g., 'Slots', 'Progressive Slots', 'Blackjack', 'Roulette', 'Tap', 'Slingo')." },
          volatility: { type: Type.STRING, description: "Volatility rating from 1 to 8 (e.g., '2', '4', '6', '8')." },
          lines: { type: Type.STRING, description: "Number of paylines or ways (e.g., '243', 'Cluster Pays')." },
          reels: { type: Type.STRING, description: "Number of reels (e.g., '5', '3', 'Cluster Pays')." },
          theme: {
            type: Type.ARRAY,
            description: "List of themes for the game from the allowed list.",
            items: { type: Type.STRING }
          },
          features: {
            type: Type.ARRAY,
            description: "List of key features for the game from the allowed list.",
            items: { type: Type.STRING }
          },
        }
      };

      const enrichmentPromises = processedData.map(async (game) => {
        // Skip if data already exists to avoid unnecessary API calls
        if (game.gamesCustomFields_gameType && game.gamesCustomFields_theme) {
            return game;
        }

        const prompt = `
Analyze the casino game named '${game.name}' from provider '${game.gameProvider}'. Preserve all special characters (™, ®, ©) in the name. Provide the following details based on the strict rules below.

**Game Information Rules:**

1.  **gameType**: The primary category. Use "Slots" for standard slots, "Progressive Slots" if it has a major progressive jackpot. Other options: "Blackjack", "Roulette", "Tap", "Slingo".
2.  **volatility**: A number on a scale of 1 to 8. Use these mappings: Low=2, Medium=4, Medium-High=6, High/Very High=8.
3.  **lines**: The number of paylines or ways (e.g., "20", "243", "117649", "Cluster Pays").
4.  **reels**: The number of reels. THIS IS CRITICAL. Be exceptionally accurate. Cross-reference multiple sources. Classic/retro slots are often 3 reels.
5.  **theme**: A list of themes selected ONLY from the 'Allowed Themes' list.
6.  **features**: A list of prominent features (max 20) selected ONLY from the 'Allowed Features' list.

**Allowed Themes:**
"Asian", "Egypt", "Mythology", "Animals", "Buffalos", "Vegas Vibes", "Adventure", "Fantasy", "Gems", "Fruits", "Wild West", "Irish", "Magic", "Sci-Fi", "Horror", "Money", "Pirates", "Candy", "Fishing", "Rome", "Pigs", "Barnyard Bonanza", "Greek Gods", "Retro Reels".

**Allowed Features:**
"Megaways", "Hold and Win", "Cash Collect", "Link&Win", "Cluster Pays", "Jackpot", "Expanding Wilds", "Sticky Wilds", "Cascading Reels", "Colossal Symbols", "Multipliers", "Respins", "Infinity Reels", "Ways to Win", "Split Symbols", "Nudging Wilds", "Power Reels", "Gigablox", "InfiniReels", "Bonus Wheel".

**IMPORTANT SPECIFIC RULES:**

*   **DO NOT** list "Free Spins", "Bonus Buy", "Bonus Game", or "Gamble" as features.
*   If a game has **3 reels**, its themes MUST include "Retro Reels".
*   If a game is based on Greek mythology (e.g., 'Age of the Gods', 'Gates of Olympus'), its themes MUST include both 'Mythology' and 'Greek Gods'.
*   If a game has a clear Chinese or other East Asian name or theme, its theme MUST include "Asian".
*   If a game's main subject is buffalos, its themes MUST include 'Animals' and 'Buffalos'.
*   If a game features pigs, its themes MUST include 'Animals', 'Pigs', and 'Barnyard Bonanza'.
*   If a game is known to be available in land-based casinos, its themes MUST include "Vegas Vibes".
*   If info is not available for a field: return an empty string for text fields, and an empty list for list fields. Do not use "N/A".
`;

        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: responseSchema,
            },
          });
          
          const jsonText = response.text.trim();
          const enrichedData = JSON.parse(jsonText);

          return {
            ...game,
            gamesCustomFields_gameType: enrichedData.gameType || game.gamesCustomFields_gameType,
            gamesCustomFields_theme: enrichedData.theme?.join(', ') || game.gamesCustomFields_theme,
            gamesCustomFields_features: enrichedData.features?.join(', ') || game.gamesCustomFields_features,
            gamesCustomFields_volatility: enrichedData.volatility || game.gamesCustomFields_volatility,
            gamesCustomFields_lines: enrichedData.lines || game.gamesCustomFields_lines,
            gamesCustomFields_reels: enrichedData.reels || game.gamesCustomFields_reels,
          };
        } catch (e) {
          console.error(`Could not enrich data for ${game.name}:`, e);
          return game; // Return original game data on error
        }
      });

      const enrichedResults = await Promise.all(enrichmentPromises);
      setProcessedData(enrichedResults);

    } catch (e) {
      if (e instanceof Error) {
        setError(`Error during AI enrichment: ${e.message}`);
      } else {
        setError("An unknown error occurred during AI enrichment.");
      }
    } finally {
      setIsEnriching(false);
    }
  }, [processedData, apiKey]);


  const handleDownloadCsv = useCallback(() => {
    if (processedData.length === 0) {
      setError("No data to download.");
      return;
    }
    try {
      const csvContent = generateCsvContent(processedData, OUTPUT_CSV_COLUMNS);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
      const fileName = `processed_game_data_${timestamp}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      if (e instanceof Error) {
        setError(`Error generating CSV: ${e.message}`);
      } else {
        setError("An unknown error occurred while generating CSV.");
      }
    }
  }, [processedData]);

  const handleClearData = useCallback(() => {
    setRawText('');
    setProcessedData([]);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 selection:bg-sky-500 selection:text-white">
      <Header title={APP_TITLE} subtitle="Paste tab-separated game data from Monday.com." />
      
      <main className="w-full max-w-5xl mt-8 space-y-8">
        <section className="bg-slate-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold text-[#66acde] mb-4">1. API Configuration</h2>
          <ApiKeyInput value={apiKey} onChange={setApiKey} />
        </section>

        <section className="bg-slate-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold text-[#66acde] mb-4">2. Paste Game Data</h2>
          <p className="text-slate-400 mb-4 text-sm">Input to include: Name, Game Provider, IMS Game Code, Portrait Tile, and Landscape tile.</p>
          <TextInputArea
            value={rawText}
            onChange={setRawText}
            placeholder={`Paste your tab-separated game data here. Ensure the first row contains all necessary headers. ${PLACEHOLDER_INFO_REQUIRED_COLUMNS}`}
          />
          <div className="mt-6 flex flex-wrap gap-4 items-center">
            <ActionButton
              onClick={() => handleProcessData(GAME_PROVIDER_TO_FOLDER_MAP_CA, ".CA")}
              disabled={isLoading || !rawText.trim()}
              className="bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:text-slate-500 transition-colors"
              icon={<ProcessIcon />}
            >
              {isLoading ? 'Processing...' : 'Process: .CA'}
            </ActionButton>
            <ActionButton
              onClick={() => handleProcessData(GAME_PROVIDER_TO_FOLDER_MAP_COM, ".COM")}
              disabled={isLoading || !rawText.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-slate-500 transition-colors"
              icon={<ProcessIcon />}
            >
              {isLoading ? 'Processing...' : 'Process: .COM'}
            </ActionButton>
            <ActionButton
              onClick={handleClearData}
              disabled={!rawText.trim() && processedData.length === 0 && !error}
              className="bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 disabled:text-slate-500 transition-colors ml-auto"
              icon={<ClearIcon />}
              title="Clear input and results"
            >
              Clear Data
            </ActionButton>
          </div>
        </section>

        {error && (
          <section className="bg-red-800 p-4 rounded-lg shadow-md text-red-100">
            <h3 className="font-semibold">Error:</h3>
            <p>{error}</p>
          </section>
        )}

        {isLoading && (
           <div className="flex justify-center items-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#66acde]"></div>
            <p className="ml-3 text-sky-300">Processing data, please wait...</p>
          </div>
        )}

        {isEnriching && (
           <div className="flex justify-center items-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fuchsia-500"></div>
            <p className="ml-3 text-fuchsia-300">🤖 Gathering game info with AI... This might take a moment.</p>
          </div>
        )}

        {!isLoading && processedData.length > 0 && (
          <section className="bg-slate-800 p-6 rounded-lg shadow-xl">
            <div className="flex items-center mb-4">
              <TableIcon className="w-8 h-8 text-[#66acde] mr-3" />
              <h2 className="text-2xl font-semibold text-[#66acde]">3. Processed Data Preview</h2>
            </div>
            <DataTable data={processedData} columns={OUTPUT_CSV_COLUMNS} />
             <div className="flex flex-wrap gap-4 mt-6">
                <ActionButton
                  onClick={handleDownloadCsv}
                  disabled={processedData.length === 0 || isEnriching}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-slate-500 transition-colors"
                  icon={<DownloadIcon />}
                >
                  Download CSV
                </ActionButton>
                <ActionButton
                  onClick={handleEnrichData}
                  disabled={processedData.length === 0 || isLoading || isEnriching || !apiKey.trim()}
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-fuchsia-800 disabled:text-slate-500 transition-colors"
                  icon={<SparklesIcon />}
                  title={!apiKey.trim() ? "Enter your Gemini API key to enable this feature" : "Use AI to find and fill in missing game details"}
                >
                  {isEnriching ? 'Enriching...' : '✨ Enrich with AI'}
                </ActionButton>
            </div>
          </section>
        )}
         {!isLoading && processedData.length === 0 && rawText.trim() && !error && (
            <section className="bg-slate-800 p-6 rounded-lg shadow-xl text-center">
                 <p className="text-slate-400">No data to display. Please check your input or click one of the process buttons. If you've processed data and see this, there might have been no valid rows meeting criteria.</p>
            </section>
        )}
      </main>
       <footer className="w-full max-w-5xl mt-12 py-6 border-t border-slate-700 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Created by Bob Fox. Built with React & Tailwind CSS.</p>
      </footer>
    </div>
  );
};

export default App;
