import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface ProcessedGameData {
  // Core fields
  gameCode: string;
  name: string;
  isActive: boolean;
  mobileGameCode?: string;
  seoFriendlyGameName: string;
  defaultGameImage: string;

  // Game details
  desktopGameType?: string;
  mobileGameType?: string;
  liveLaunchAlias?: string;
  bingoGameType?: string;
  vfGameType?: string;
  jackpotCode?: string;
  demoModeSupport?: string;
  gameMode?: string;
  gameProvider?: string;
  urlCustomParameters?: string;
  isExcludedFromPGG: boolean;
  isExcludedFromSitemap: boolean;

  // Availability
  deviceAvailability_mobile: boolean;
  deviceAvailability_tablet: boolean;
  deviceAvailability_desktop: boolean;
  browserAvailability_edge: boolean;
  browserAvailability_safari: boolean;
  browserAvailability_chrome: boolean;
  browserAvailability_firefox: boolean;
  browserAvailability_other: boolean;
  osAvailability_ios: boolean;
  osAvailability_macintosh: boolean;
  osAvailability_android: boolean;
  osAvailability_windows: boolean;
  osAvailability_other: boolean;

  // Image URLs
  landscape_layout1x1_mainImage?: string;
  landscape_layout1x1_mobileImage?: string;
  landscape_layout1x1_guestMainImage?: string;
  landscape_layout1x1_guestMobileImage?: string;
  landscape_layout1x2_mainImage?: string;
  landscape_layout1x2_mobileImage?: string;
  landscape_layout1x2_guestMainImage?: string;
  landscape_layout1x2_guestMobileImage?: string;
  landscape_layout2x1_mainImage?: string;
  landscape_layout2x1_mobileImage?: string;
  landscape_layout2x1_guestMainImage?: string;
  landscape_layout2x1_guestMobileImage?: string;
  landscape_layout2x2_mainImage?: string;
  landscape_layout2x2_mobileImage?: string;
  landscape_layout2x2_guestMainImage?: string;
  landscape_layout2x2_guestMobileImage?: string;

  portrait_layout1x1_mainImage?: string;
  portrait_layout1x1_mobileImage?: string;
  portrait_layout1x1_guestMainImage?: string;
  portrait_layout1x1_guestMobileImage?: string;
  portrait_layout1x2_mainImage?: string;
  portrait_layout1x2_mobileImage?: string;
  portrait_layout1x2_guestMainImage?: string;
  portrait_layout1x2_guestMobileImage?: string;
  portrait_layout2x1_mainImage?: string;
  portrait_layout2x1_mobileImage?: string;
  portrait_layout2x1_guestMainImage?: string;
  portrait_layout2x1_guestMobileImage?: string;
  portrait_layout2x2_mainImage?: string;
  portrait_layout2x2_mobileImage?: string;
  portrait_layout2x2_guestMainImage?: string;
  portrait_layout2x2_guestMobileImage?: string;

  square_layout1x1_mainImage?: string;
  square_layout1x1_mobileImage?: string;
  square_layout1x1_guestMainImage?: string;
  square_layout1x1_guestMobileImage?: string;
  square_layout1x2_mainImage?: string;
  square_layout1x2_mobileImage?: string;
  square_layout1x2_guestMainImage?: string;
  square_layout1x2_guestMobileImage?: string;
  square_layout2x1_mainImage?: string;
  square_layout2x1_mobileImage?: string;
  square_layout2x1_guestMainImage?: string;
  square_layout2x1_guestMobileImage?: string;
  square_layout2x2_mainImage?: string;
  square_layout2x2_mobileImage?: string;
  square_layout2x2_guestMainImage?: string;
  square_layout2x2_guestMobileImage?: string;
  
  // Other metadata
  articleId?: string;
  mobileArticleId?: string;
  description?: string;
  isGameNew: boolean;
  isGamePopular: boolean;
  isGameHot: boolean;
  isGameExclusive: boolean;

  // Labels
  ['gameLabelsData_Drops and Wins']?: string;
  ['gameLabelsData_Rising Star']?: string;
  gameLabelsData_Exclusive?: string;
  gameLabelsData_New?: string;

  // Custom fields
  gamesCustomFields_provider?: string;
  gamesCustomFields_externalProviderGameId?: string;
  gamesCustomFields_gameType?: string;
  'gamesCustomFields_Theme'?: string;
  gamesCustomFields_features?: string;
  gamesCustomFields_volatility?: string;
  gamesCustomFields_rtp?: string;
  'gamesCustomFields_Paylines'?: string;
  gamesCustomFields_reels?: string;

  // New Fields
  rtp?: string;
  volatilityIndex?: string;
  isFreeSpinsFeatureActive: boolean;
  isGoldenChipsFeatureActive: boolean;
  ['gameLabelsData_Best']?: string;
  ['gameLabelsData_Hot']?: string;
  gamesCustomFields_Screenshot?: string;
  ['gamesCustomFields_Min bet']?: string;
  gamesCustomFields_Description?: string;
}

export interface GameProviderFolderMapping {
  [providerName: string]: string;
}

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

const APP_TITLE = "Portal Game Creator";

const GAME_PROVIDER_TO_FOLDER_MAP_CA: GameProviderFolderMapping = {
  "AGS": "AGS",
  "Greentube": "Green Tube",
  "Pragmatic": "Pragmatic",
  "Games Global": "games-global",
  "Hacksaw": "Hacksaw",
  "HACKSAW OpenRGS": "Hacksaw",
  "HACKSAW": "Hacksaw",
  "ELK-Studios": "ELK-Studios",
  "ELK Studios via LNW": "ELK-Studios",
  "ELK Studios": "ELK-Studios",
  "Gaming Realms": "Gaming Realms",
  "High 5": "High 5",
  "High5 via SG": "High 5",
  "Lightning Box": "Lightning Box",
  "Peter & Sons": "Peter & Sons",
  "Quickspin": "Quickspin",
  "SG": "SG",
  "Wazdan": "Wazdan",
  "Blueprint": "Blueprint",
  "Bragg": "Bragg",
  "eyecon": "eyecon",
  "Eyecon": "eyecon",
  "IGT": "IGT",
  "Konami": "Konami",
  "Konami via SG": "Konami",
  "Inspired": "Inspired",
  "Live Casino": "Live Casino",
  "Oryx": "Oryx",
  "Playtech": "Playtech",
  "Relax Gaming": "Relax Gaming",
  "SkyWind": "SkyWind",
  "Skywind": "SkyWind",
  "Drops & Wins": "Drops & Wins",
  "RubyPlay": "Rubyplay",
  "Test": "Test"
};

const GAME_PROVIDER_TO_FOLDER_MAP_COM: GameProviderFolderMapping = {
  "Blueprint": "Blueprint",
  "Bragg": "Bragg",
  "Drops & Wins": "Drops & Wins",
  "Games Global": "Games Global",
  "Live Casino": "Live Casino",
  "Oryx": "Oryx",
  "Peter & Sons": "Peter & Sons",
  "Playtech": "Playtech",
  "Pragmatic": "Pragmatic",
  "Quickspin": "Quickspin",
  "RubyPlay": "RubyPlay",
  "Test": "Test",
  "AGS": "AGS",
  "Greentube": "Greentube",
  "Hacksaw": "Hacksaw",
  "HACKSAW OpenRGS": "Hacksaw",
  "HACKSAW": "Hacksaw",
  "ELK-Studios": "ELK-Studios",
  "ELK Studios via LNW": "ELK-Studios",
  "ELK Studios": "ELK-Studios",
  "Gaming Realms": "Gaming Realms",
  "High 5": "High 5",
  "High5 via SG": "High 5",
  "Lightning Box": "Lightning Box",
  "SG": "SG",
  "Wazdan": "Wazdan",
  "eyecon": "eyecon",
  "Eyecon": "eyecon",
  "IGT": "IGT",
  "Konami": "Konami",
  "Konami via SG": "Konami",
  "Inspired": "Inspired",
  "Relax Gaming": "Relax Gaming",
  "SkyWind": "SkyWind",
  "Skywind": "SkyWind",
};

const INPUT_HEADER_MAPPINGS = {
  NAME: "Name",
  GAME_PROVIDER: "Game Provider",
  PROVIDER_GAME_CODE: "Provider Game Code",
  IMS_GAME_CODE: "IMS Game Code",
  CATEGORY: "Category",
  TILE_STATUS: "Tile",
  PORTRAIT_TILE_STATUS: "Portrait Tile",
} as const;

const CORE_REQUIRED_INPUT_HEADER_KEYS: (keyof typeof INPUT_HEADER_MAPPINGS)[] = [
  'NAME',
  'GAME_PROVIDER',
  'IMS_GAME_CODE',
];

const PLACEHOLDER_INFO_REQUIRED_COLUMNS = "Core required headers: Name, Game Provider, IMS Game Code.";

const OUTPUT_CSV_COLUMNS: (keyof ProcessedGameData | string)[] = [
  'gameCode',
  'name',
  'isActive',
  'mobileGameCode',
  'seoFriendlyGameName',
  'desktopGameType',
  'mobileGameType',
  'liveLaunchAlias',
  'bingoGameType',
  'vfGameType',
  'jackpotCode',
  'demoModeSupport',
  'gameMode',
  'gameProvider',
  'urlCustomParameters',
  'isExcludedFromPGG',
  'isExcludedFromSitemap',
  'deviceAvailability_mobile',
  'deviceAvailability_tablet',
  'deviceAvailability_desktop',
  'browserAvailability_edge',
  'browserAvailability_safari',
  'browserAvailability_chrome',
  'browserAvailability_firefox',
  'browserAvailability_other',
  'osAvailability_ios',
  'osAvailability_macintosh',
  'osAvailability_android',
  'osAvailability_windows',
  'osAvailability_other',
  'defaultGameImage',
  'landscape_layout1x1_mainImage',
  'landscape_layout1x1_mobileImage',
  'landscape_layout1x1_guestMainImage',
  'landscape_layout1x1_guestMobileImage',
  'landscape_layout1x2_mainImage',
  'landscape_layout1x2_mobileImage',
  'landscape_layout1x2_guestMainImage',
  'landscape_layout1x2_guestMobileImage',
  'landscape_layout2x1_mainImage',
  'landscape_layout2x1_mobileImage',
  'landscape_layout2x1_guestMainImage',
  'landscape_layout2x1_guestMobileImage',
  'landscape_layout2x2_mainImage',
  'landscape_layout2x2_mobileImage',
  'landscape_layout2x2_guestMainImage',
  'landscape_layout2x2_guestMobileImage',
  'square_layout1x1_mainImage',
  'square_layout1x1_mobileImage',
  'square_layout1x1_guestMainImage',
  'square_layout1x1_guestMobileImage',
  'square_layout1x2_mainImage',
  'square_layout1x2_mobileImage',
  'square_layout1x2_guestMainImage',
  'square_layout1x2_guestMobileImage',
  'square_layout2x1_mainImage',
  'square_layout2x1_mobileImage',
  'square_layout2x1_guestMainImage',
  'square_layout2x1_guestMobileImage',
  'square_layout2x2_mainImage',
  'square_layout2x2_mobileImage',
  'square_layout2x2_guestMainImage',
  'square_layout2x2_guestMobileImage',
  'portrait_layout1x1_mainImage',
  'portrait_layout1x1_mobileImage',
  'portrait_layout1x1_guestMainImage',
  'portrait_layout1x1_guestMobileImage',
  'portrait_layout1x2_mainImage',
  'portrait_layout1x2_mobileImage',
  'portrait_layout1x2_guestMainImage',
  'portrait_layout1x2_guestMobileImage',
  'portrait_layout2x1_mainImage',
  'portrait_layout2x1_mobileImage',
  'portrait_layout2x1_guestMainImage',
  'portrait_layout2x1_guestMobileImage',
  'portrait_layout2x2_mainImage',
  'portrait_layout2x2_mobileImage',
  'portrait_layout2x2_guestMainImage',
  'portrait_layout2x2_guestMobileImage',
  'articleId',
  'mobileArticleId',
  'description',
  'isGameNew',
  'isGamePopular',
  'isGameHot',
  'isGameExclusive',
  'gameLabelsData_Exclusive',
  'gameLabelsData_New',
  'gamesCustomFields_gameType',
  'gamesCustomFields_Theme',
  'gamesCustomFields_features',
  'gamesCustomFields_volatility',
  'gamesCustomFields_rtp',
  'gamesCustomFields_Paylines',
  'gamesCustomFields_reels',
  'gamesCustomFields_provider',
  'rtp',
  'volatilityIndex',
  'isFreeSpinsFeatureActive',
  'isGoldenChipsFeatureActive',
  'gameLabelsData_Best',
  'gameLabelsData_Hot',
  'gamesCustomFields_Screenshot',
  'gamesCustomFields_Min bet',
  'gamesCustomFields_Description',
];

// -----------------------------------------------------------------------------
// COMPONENTS
// -----------------------------------------------------------------------------

const ProcessIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className="w-5 h-5"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className="w-5 h-5"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const TableIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className="w-6 h-6"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5V7.5c0-.988.708-1.763 1.623-1.954C6.278 5.343 7.57 5.25 9 5.25h6c1.43 0 2.722.093 3.998.296C20.042 5.737 20.75 6.512 20.75 7.5v10.875m-17.25 0c0 .621.504 1.125 1.125 1.125h15c.621 0 1.125-.504 1.125-1.125m-17.25 0h17.25M3.75 9.75h16.5M3.75 12.75h16.5m-16.5 3h16.5" />
  </svg>
);

const ClearIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5} 
    stroke="currentColor" 
    className="w-5 h-5"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.222.261m3.222.261L8.85 3.55M11.882 3.55a48.147 48.147 0 014.288 0M5.106 5.79l-.007.005a48.294 48.294 0 01-.429 2.58M16.5 5.25h-9"
    />
  </svg>
);

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456l1.178.398-1.178.398a3.375 3.375 0 00-2.456 2.456z"
    />
  </svg>
);

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="w-full max-w-5xl text-center py-2">
      <img
        src="https://digibeat.com/wp-content/uploads/2022/06/logo-white-300x80.png"
        alt="Digibeat Logo"
        className="h-10 mx-auto mb-2"
      />
      <h1 className="text-2xl font-bold text-[#66acde] sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-400 sm:text-base">{subtitle}</p>}
    </header>
  );
};

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

const TextInputArea: React.FC<TextInputAreaProps> = ({ value, onChange, placeholder, rows = 10 }) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-100 placeholder-slate-400 transition-colors text-sm"
      spellCheck="false"
    />
  );
};

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  title?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled = false,
  children,
  icon,
  className = 'bg-sky-600 hover:bg-sky-500',
  title
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        flex items-center justify-center px-4 py-2 border border-transparent 
        text-base font-medium rounded-md shadow-sm text-white 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-[#66acde]
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-150 ease-in-out
        ${className}
      `}
    >
      {icon && <span className="mr-2 h-5 w-5">{icon}</span>}
      {children}
    </button>
  );
};

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ value, onChange }) => {
  return (
    <div>
      <input
        id="apiKey"
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter Google Gemini API Key"
        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-100 placeholder-slate-400 transition-colors text-sm"
        aria-label="Gemini API Key Input"
        autoComplete="off"
      />
       <p className="text-xs text-slate-500 mt-2">
        Required for the 'Enrich with AI' feature. Get a key from{' '}
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sky-400 hover:underline"
        >
          Google AI Studio
        </a>.
      </p>
    </div>
  );
};

interface DataTableProps {
  data: ProcessedGameData[];
  columns: (keyof ProcessedGameData | string)[];
}

const columnDisplayNames: Record<string, string> = {
  gameCode: "Game Code",
  name: "Name",
  isActive: "Active",
  mobileGameCode: "Mobile Game Code",
  seoFriendlyGameName: "SEO Friendly Name",
  defaultGameImage: "Default Game Image URL",
  gameProvider: "Game Provider",
  desktopGameType: "Desktop Type",
  mobileGameType: "Mobile Type",
  liveLaunchAlias: "Live Launch Alias", 
  bingoGameType: "Bingo Type", 
  vfGameType: "VF Game Type",   
  jackpotCode: "Jackpot Code",
  demoModeSupport: "Demo Mode Support",
  gameMode: "Game Mode",
  urlCustomParameters: "URL Custom Params",
  isExcludedFromPGG: "Excluded PGG", 
  isExcludedFromSitemap: "Excluded Sitemap",
  deviceAvailability_mobile: "Mobile Available",
  deviceAvailability_tablet: "Tablet Available",
  deviceAvailability_desktop: "Desktop Available",
  browserAvailability_edge: "Edge Available",
  browserAvailability_safari: "Safari Available",
  browserAvailability_chrome: "Chrome Available",
  browserAvailability_firefox: "Firefox Available",
  browserAvailability_other: "Other Browser Available",
  osAvailability_ios: "iOS Available",
  osAvailability_macintosh: "Mac Available",
  osAvailability_android: "Android Available",
  osAvailability_windows: "Windows Available",
  osAvailability_other: "Other OS Available",
  landscape_layout1x1_mainImage: "L 1x1 Main",
  landscape_layout1x1_mobileImage: "L 1x1 Mobile",
  landscape_layout1x1_guestMainImage: "L 1x1 Guest Main",
  landscape_layout1x1_guestMobileImage: "L 1x1 Guest Mobile",
  landscape_layout1x2_mainImage: "L 1x2 Main",
  landscape_layout1x2_mobileImage: "L 1x2 Mobile",
  landscape_layout1x2_guestMainImage: "L 1x2 Guest Main",
  landscape_layout1x2_guestMobileImage: "L 1x2 Guest Mobile",
  landscape_layout2x1_mainImage: "L 2x1 Main",
  landscape_layout2x1_mobileImage: "L 2x1 Mobile",
  landscape_layout2x1_guestMainImage: "L 2x1 Guest Main",
  landscape_layout2x1_guestMobileImage: "L 2x1 Guest Mobile",
  landscape_layout2x2_mainImage: "L 2x2 Main",
  landscape_layout2x2_mobileImage: "L 2x2 Mobile",
  landscape_layout2x2_guestMainImage: "L 2x2 Guest Main",
  landscape_layout2x2_guestMobileImage: "L 2x2 Guest Mobile",
  square_layout1x1_mainImage: "S 1x1 Main",
  square_layout1x1_mobileImage: "S 1x1 Mobile",
  square_layout1x1_guestMainImage: "S 1x1 Guest Main",
  square_layout1x1_guestMobileImage: "S 1x1 Guest Mobile",
  square_layout1x2_mainImage: "S 1x2 Main",
  square_layout1x2_mobileImage: "S 1x2 Mobile",
  square_layout1x2_guestMainImage: "S 1x2 Guest Main",
  square_layout1x2_guestMobileImage: "S 1x2 Guest Mobile",
  square_layout2x1_mainImage: "S 2x1 Main",
  square_layout2x1_mobileImage: "S 2x1 Mobile",
  square_layout2x1_guestMainImage: "S 2x1 Guest Main",
  square_layout2x1_guestMobileImage: "S 2x1 Guest Mobile",
  square_layout2x2_mainImage: "S 2x2 Main",
  square_layout2x2_mobileImage: "S 2x2 Mobile",
  square_layout2x2_guestMainImage: "S 2x2 Guest Main",
  square_layout2x2_guestMobileImage: "S 2x2 Guest Mobile",
  portrait_layout1x1_mainImage: "P 1x1 Main",
  portrait_layout1x1_mobileImage: "P 1x1 Mobile",
  portrait_layout1x1_guestMainImage: "P 1x1 Guest Main",
  portrait_layout1x1_guestMobileImage: "P 1x1 Guest Mobile",
  portrait_layout1x2_mainImage: "P 1x2 Main",
  portrait_layout1x2_mobileImage: "P 1x2 Mobile",
  portrait_layout1x2_guestMainImage: "P 1x2 Guest Main",
  portrait_layout1x2_guestMobileImage: "P 1x2 Guest Mobile",
  portrait_layout2x1_mainImage: "P 2x1 Main",
  portrait_layout2x1_mobileImage: "P 2x1 Mobile",
  portrait_layout2x1_guestMainImage: "P 2x1 Guest Main",
  portrait_layout2x1_guestMobileImage: "P 2x1 Guest Mobile",
  portrait_layout2x2_mainImage: "P 2x2 Main",
  portrait_layout2x2_mobileImage: "P 2x2 Mobile",
  portrait_layout2x2_guestMainImage: "P 2x2 Guest Main",
  portrait_layout2x2_guestMobileImage: "P 2x2 Guest Mobile",
  articleId: "Article ID", 
  mobileArticleId: "Mobile Article ID",
  description: "Description",
  isGameNew: "Is Game New", 
  isGamePopular: "Popular",
  isGameHot: "Hot",
  isGameExclusive: "Game Exclusive",
  'gameLabelsData_Drops and Wins': "Drops & Wins Label", 
  'gameLabelsData_Rising Star': "Rising Star Label",
  gameLabelsData_Exclusive: "Exclusive Label",
  gameLabelsData_New: "New Label",
  gamesCustomFields_provider: "Custom Provider",
  gamesCustomFields_externalProviderGameId: "Custom Ext. Provider ID", 
  gamesCustomFields_gameType: "Game Type",
  'gamesCustomFields_Theme': "Theme",
  gamesCustomFields_features: "Features",
  gamesCustomFields_volatility: "Volatility",
  gamesCustomFields_rtp: "Custom RTP",
  'gamesCustomFields_Paylines': "Paylines",
  gamesCustomFields_reels: "Reels",
  rtp: "RTP",
  volatilityIndex: "Volatility Index",
  isFreeSpinsFeatureActive: "Free Spins Active",
  isGoldenChipsFeatureActive: "Golden Chips Active",
  'gameLabelsData_Best': "Best Label",
  'gameLabelsData_Hot': "Hot Label",
  gamesCustomFields_Screenshot: "Screenshot URL",
  'gamesCustomFields_Min bet': "Min Bet",
  gamesCustomFields_Description: "Custom Description",
};

const DataTable: React.FC<DataTableProps> = ({ data, columns }) => {
  if (!data || data.length === 0) {
    return <p className="text-slate-400 italic">No data to display.</p>;
  }

  return (
    <div className="overflow-x-auto bg-slate-700 rounded-md shadow">
      <table className="min-w-full divide-y divide-slate-600">
        <thead className="bg-slate-800">
          <tr>
            {columns.map((key) => (
              <th
                key={String(key)}
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider whitespace-nowrap"
              >
                {columnDisplayNames[String(key)] || String(key).replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-slate-700 divide-y divide-slate-600">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={`${rowIndex % 2 === 0 ? 'bg-slate-700' : 'bg-slate-750'} hover:bg-slate-600 transition-colors`}>
              {columns.map((key) => (
                <td key={String(key)} className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">
                  {key === 'defaultGameImage' || (typeof row[key as keyof ProcessedGameData] === 'string' && (row[key as keyof ProcessedGameData] as string).includes('file/')) ? (
                    <a 
                      href={String(row[key as keyof ProcessedGameData])} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#66acde] transition-opacity hover:opacity-80 hover:underline break-all"
                      title={String(row[key as keyof ProcessedGameData])}
                    >
                      {String(row[key as keyof ProcessedGameData]).length > 50 ? String(row[key as keyof ProcessedGameData]).substring(0, 47) + '...' : String(row[key as keyof ProcessedGameData])}
                    </a>
                  ) : (
                    String(row[key as keyof ProcessedGameData] === undefined || row[key as keyof ProcessedGameData] === null ? '' : row[key as keyof ProcessedGameData])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// -----------------------------------------------------------------------------
// SERVICES
// -----------------------------------------------------------------------------

function sanitizeForLegacyCsv(text: string): string {
    if (typeof text !== 'string' || !text) {
        return '';
    }
    // Replace & with 'and' for CMS compatibility
    const noAmpersands = text.replace(/&/g, 'and');
    // Normalize and remove accents
    return noAmpersands.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function generateSeoFriendlyName(name: string): string {
  if (!name) return '';
  const sanitizedName = sanitizeForLegacyCsv(name);
  return sanitizedName
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parsePastedData(
  text: string,
  providerMap: GameProviderFolderMapping,
  options: { isGameNew: boolean; isMaintenanceMode: boolean; }
): ProcessedGameData[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    throw new Error("Data must include a header row and at least one data row.");
  }

  const headerCells = lines[0].split('\t').map(cell => cell.trim());
  const headerIndices: { [internalKey: string]: number } = {};
  const missingRequiredHeaders: string[] = [];

  const mappingKeys = Object.keys(INPUT_HEADER_MAPPINGS) as (keyof typeof INPUT_HEADER_MAPPINGS)[];
  for (const internalKey of mappingKeys) {
    const expectedHeader = INPUT_HEADER_MAPPINGS[internalKey];
    const index = headerCells.findIndex(h => h.toLowerCase() === expectedHeader.toLowerCase());
    if (index !== -1) {
      headerIndices[internalKey] = index;
    } else {
      if (CORE_REQUIRED_INPUT_HEADER_KEYS.includes(internalKey)) {
        missingRequiredHeaders.push(expectedHeader);
      }
    }
  }

  if (missingRequiredHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingRequiredHeaders.join(', ')}.`);
  }
  
  const processedGames: ProcessedGameData[] = [];

  const providerDisplayNameMap: { [key: string]: string } = {
    'pragmatic': 'Pragmatic Play',
    'sg': 'Light and Wonder',
    'peter & sons': 'Peter and Sons',
    'hacksaw': 'Hacksaw',
    'hacksaw openrgs': 'Hacksaw',
  };

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split('\t');
    
    const getCellValue = (internalKey: keyof typeof INPUT_HEADER_MAPPINGS): string | undefined => {
      const index = headerIndices[internalKey];
      return index !== undefined ? cells[index]?.trim() : undefined;
    };

    const gameCode = getCellValue('IMS_GAME_CODE');
    const name = getCellValue('NAME');
    const originalGameProvider = getCellValue('GAME_PROVIDER'); 
    const providerGameCode = getCellValue('PROVIDER_GAME_CODE');
    const category = getCellValue('CATEGORY');
    const portraitTileStatus = getCellValue('PORTRAIT_TILE_STATUS');
    const tileStatus = getCellValue('TILE_STATUS');

    if (!gameCode || !name || !originalGameProvider) {
      console.warn(`Skipping line ${i + 1}: Missing core data (gameCode, name, or gameProvider).`);
      continue;
    }

    const lowerCaseProvider = originalGameProvider.trim().toLowerCase();
    let finalGameProvider: string;
    let providerForImageUrl: string;

    if (lowerCaseProvider.includes(' via bragg')) {
        finalGameProvider = originalGameProvider.replace(/ via bragg/i, '').trim();
        providerForImageUrl = 'Bragg';
    } else if (lowerCaseProvider.includes(' via sg') || lowerCaseProvider.includes(' via lnw')) {
        finalGameProvider = originalGameProvider.replace(/ via sg/i, '').replace(/ via lnw/i, '').trim();
        
        if (finalGameProvider.toLowerCase() === 'high5') {
            finalGameProvider = 'High 5';
        } else if (finalGameProvider.toLowerCase() === 'lightning box') {
            finalGameProvider = 'Lightning Box';
        }

        if (finalGameProvider.toLowerCase().startsWith('elk studio')) {
            providerForImageUrl = finalGameProvider;
        } else {
            providerForImageUrl = 'SG';
        }
    } else {
        finalGameProvider = providerDisplayNameMap[lowerCaseProvider] || originalGameProvider;
        providerForImageUrl = originalGameProvider;
    }

    const seoFriendlyGameName = generateSeoFriendlyName(name);
    
    const folderNameFromMap = providerMap[providerForImageUrl];
    const providerFolderName = folderNameFromMap || providerForImageUrl; 
    const encodedFolderName = encodeURIComponent(providerFolderName);
    const baseIconPath = `library/Game%20Icons/${encodedFolderName}`;
    
    const defaultGameImage = `/${baseIconPath}/${gameCode}.webp`;
    
    const portrait_layout1x1_mainImage = (portraitTileStatus?.trim().toLowerCase() === 'done')
        ? `/${baseIconPath}/${gameCode}_p.webp`
        : undefined;

    // L 1x1 Main should be empty per user request (previously was based on tileStatus)
    const landscape_layout1x1_mainImage = undefined;
    
    let desktopGameTypeFinal = "POP";
    let mobileGameTypeFinal = "POP";
    let liveLaunchAliasValue = undefined; 

    if (lowerCaseProvider === "playtech") {
      desktopGameTypeFinal = "GPAS";
      mobileGameTypeFinal = "GPAS";
    } else if (lowerCaseProvider === "playtech live") {
      desktopGameTypeFinal = "LIVE";
      mobileGameTypeFinal = "LIVE";
      liveLaunchAliasValue = gameCode; 
    }

    const rowData: ProcessedGameData = {
      gameCode, 
      name,
      isActive: true,
      mobileGameCode: gameCode,
      seoFriendlyGameName,
      defaultGameImage,
      gameProvider: finalGameProvider, 
      desktopGameType: desktopGameTypeFinal,
      mobileGameType: mobileGameTypeFinal,
      liveLaunchAlias: liveLaunchAliasValue,
      isExcludedFromPGG: false,
      isExcludedFromSitemap: false, 
      deviceAvailability_mobile: true,
      deviceAvailability_tablet: true,
      deviceAvailability_desktop: true,
      browserAvailability_edge: true,
      browserAvailability_safari: true,
      browserAvailability_chrome: true,
      browserAvailability_firefox: true,
      browserAvailability_other: true,
      osAvailability_ios: true,
      osAvailability_macintosh: true,
      osAvailability_android: true,
      osAvailability_windows: true,
      osAvailability_other: true,
      isGameNew: options.isGameNew,
      isGamePopular: false,
      isGameHot: false,
      isGameExclusive: false,
      demoModeSupport: "unavailable", 
      gameMode: options.isMaintenanceMode ? "maintenance" : "Default",
      
      landscape_layout1x1_mainImage: landscape_layout1x1_mainImage,
      portrait_layout1x1_mainImage: portrait_layout1x1_mainImage,
      
      gamesCustomFields_provider: finalGameProvider,
      gamesCustomFields_externalProviderGameId: providerGameCode,
      gamesCustomFields_gameType: category,
      gameLabelsData_New: options.isGameNew ? "New" : undefined,

      isFreeSpinsFeatureActive: false,
      isGoldenChipsFeatureActive: false,

      // Set all other fields to undefined/default to match the new output format
      bingoGameType: undefined,
      vfGameType: undefined,
      jackpotCode: undefined,
      urlCustomParameters: undefined,
      landscape_layout1x1_mobileImage: undefined, landscape_layout1x1_guestMainImage: undefined, landscape_layout1x1_guestMobileImage: undefined, landscape_layout1x2_mainImage: undefined, landscape_layout1x2_mobileImage: undefined, landscape_layout1x2_guestMainImage: undefined, landscape_layout1x2_guestMobileImage: undefined, landscape_layout2x1_mainImage: undefined, landscape_layout2x1_mobileImage: undefined, landscape_layout2x1_guestMainImage: undefined, landscape_layout2x1_guestMobileImage: undefined, landscape_layout2x2_mainImage: undefined, landscape_layout2x2_mobileImage: undefined, landscape_layout2x2_guestMainImage: undefined, landscape_layout2x2_guestMobileImage: undefined,
      portrait_layout1x1_mobileImage: undefined, portrait_layout1x1_guestMainImage: undefined, portrait_layout1x1_guestMobileImage: undefined, portrait_layout1x2_mainImage: undefined, portrait_layout1x2_mobileImage: undefined, portrait_layout1x2_guestMainImage: undefined, portrait_layout1x2_guestMobileImage: undefined, portrait_layout2x1_mainImage: undefined, portrait_layout2x1_mobileImage: undefined, portrait_layout2x1_guestMainImage: undefined, portrait_layout2x1_guestMobileImage: undefined, portrait_layout2x2_mainImage: undefined, portrait_layout2x2_mobileImage: undefined, portrait_layout2x2_guestMainImage: undefined, portrait_layout2x2_guestMobileImage: undefined,
      square_layout1x1_mainImage: undefined, square_layout1x1_mobileImage: undefined, square_layout1x1_guestMainImage: undefined, square_layout1x1_guestMobileImage: undefined, square_layout1x2_mainImage: undefined, square_layout1x2_mobileImage: undefined, square_layout1x2_guestMainImage: undefined, square_layout1x2_guestMobileImage: undefined, square_layout2x1_mainImage: undefined, square_layout2x1_mobileImage: undefined, square_layout2x1_guestMainImage: undefined, square_layout2x1_guestMobileImage: undefined, square_layout2x2_mainImage: undefined, square_layout2x2_mobileImage: undefined, square_layout2x2_guestMainImage: undefined, square_layout2x2_guestMobileImage: undefined,
      articleId: undefined, mobileArticleId: undefined, description: undefined, gameLabelsData_Exclusive: undefined,
      'gamesCustomFields_Theme': undefined, gamesCustomFields_features: undefined, gamesCustomFields_volatility: undefined, gamesCustomFields_rtp: undefined, 'gamesCustomFields_Paylines': undefined, gamesCustomFields_reels: undefined,
      rtp: undefined, volatilityIndex: undefined, 'gameLabelsData_Best': undefined, 'gameLabelsData_Hot': undefined, gamesCustomFields_Screenshot: undefined, 'gamesCustomFields_Min bet': undefined, gamesCustomFields_Description: undefined,
      'gameLabelsData_Drops and Wins': undefined,
      'gameLabelsData_Rising Star': undefined
    };
    processedGames.push(rowData);
  }
  return processedGames;
}

function generateCsvContent(
  data: ProcessedGameData[],
  columns: (keyof ProcessedGameData | string)[]
): string {
  if (data.length === 0) return '';

  const header = columns.join('\t') + '\n';
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col as keyof ProcessedGameData]; 
      
      if (typeof value === 'boolean') {
        return String(value).toUpperCase();
      }
      let cellValue = (value === undefined || value === null) ? '' : String(value);
      
      // Sanitize the value for legacy system compatibility
      cellValue = sanitizeForLegacyCsv(cellValue);
      
      cellValue = cellValue.replace(/\t/g, ' ').replace(/\n/g, ' '); 
      return cellValue;
    }).join('\t');
  }).join('\n');

  return header + rows;
}

// -----------------------------------------------------------------------------
// APP
// -----------------------------------------------------------------------------

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [processedData, setProcessedData] = useState<ProcessedGameData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnriching, setIsEnriching] = useState<boolean>(false);
  const [isGameNew, setIsGameNew] = useState<boolean>(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(true);
  // Set default language to Canadian English
  const [enrichmentLanguage, setEnrichmentLanguage] = useState<string>('Canadian English');

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
      const data = parsePastedData(rawText, providerMapToUse, { isGameNew, isMaintenanceMode });
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
  }, [rawText, error, isGameNew, isMaintenanceMode]);

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
            description: "List of themes for the game.",
            items: { type: Type.STRING }
          },
          features: {
            type: Type.ARRAY,
            description: "List of key features for the game.",
            items: { type: Type.STRING }
          },
        }
      };

      const enrichmentPromises = processedData.map(async (game) => {
        // Skip if data already exists to avoid unnecessary API calls
        if (game.gamesCustomFields_gameType && game['gamesCustomFields_Theme']) {
            return game;
        }

        const prompt = `
Analyze the casino game named '${game.name}' from provider '${game.gameProvider}'. Preserve all special characters (™, ®, ©) in the name. Provide the following details based on the strict rules below.

**IMPORTANT: All text-based responses (themes, features) MUST be in ${enrichmentLanguage}.**
**CRITICAL: Do NOT use accented characters. Use standard ASCII letters only for Spanish words (e.g., "Asiatico" instead of "Asiático", "Accion" instead of "Acción", "Mitologia" instead of "Mitología").**
**CRITICAL: Do NOT use ampersands (&). Use the word 'and' instead (e.g., 'Link and Win', 'Drops and Wins').**

**Game Information Rules:**

1.  **gameType**: The primary category. Use "Slots" for standard slots, "Progressive Slots" if it has a major progressive jackpot. Other options: "Blackjack", "Roulette", "Tap", "Slingo".
2.  **volatility**: A number on a scale of 1 to 8. Use these mappings: Low=2, Medium=4, Medium-High=6, High/Very High=8.
3.  **lines**: The number of paylines or ways (e.g., "20", "243", "117649", "Cluster Pays").
4.  **reels**: The number of reels. THIS IS CRITICAL. Be exceptionally accurate. Cross-reference multiple sources. Classic/retro slots are often 3 reels.
5.  **theme**: A list of themes.
6.  **features**: A list of prominent features (max 20).

**Theme & Feature Rules:**
*   **If the language is 'American English' or 'Canadian English'**, you MUST select themes and features ONLY from the 'Allowed Lists' below.
*   **If the language is 'Mexican Spanish'**, use the 'Allowed Lists' as a reference for the *types* of themes and features to identify, but provide the final list of themes and features in Mexican Spanish (without accents and without &). For example, if a game's theme is "Animals", the Spanish output should be ["Animales"].

**Allowed Lists (for English reference):**
*   **Allowed Themes:** "Asian", "Egypt", "Mythology", "Animals", "Buffalos", "Vegas Vibes", "Adventure", "Fantasy", "Gems", "Fruits", "Wild West", "Irish", "Magic", "Sci-Fi", "Horror", "Money", "Pirates", "Candy", "Fishing", "Rome", "Pigs", "Barnyard Bonanza", "Greek Gods", "Retro Reels".
*   **Allowed Features:** "Megaways", "Hold and Win", "Cash Collect", "Link&Win", "Cluster Pays", "Jackpot", "Expanding Wilds", "Sticky Wilds", "Cascading Reels", "Colossal Symbols", "Multipliers", "Respins", "Infinity Reels", "Ways to Win", "Split Symbols", "Nudging Wilds", "Power Reels", "Gigablox", "InfiniReels", "Bonus Wheel".

**IMPORTANT SPECIFIC RULES:**
*   **DO NOT** list "Free Spins", "Bonus Buy", "Bonus Game", or "Gamble" as features.
*   If a game has 3 reels, its themes MUST include "Retro Reels".
*   If a game is based on Greek mythology (e.g., 'Age of the Gods', 'Gates of Olympus'), its themes MUST include both 'Mythology' and 'Greek Gods'.
*   If a game has a clear Chinese or other East Asian name or theme, its theme MUST include "Asian".
*   If a game's main subject is buffalos, its themes MUST include 'Animals' and 'Buffalos'.
*   If a game features pigs, its themes MUST include 'Animals', 'Pigs', and 'Barnyard Bonanza'.
*   If a game is known to be available in land-based casinos, its themes MUST include "Vegas Vibes".
*   If info is not available for a field: return an empty string for text fields, and an empty list for list fields. Do not use "N/A".
`;

        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Use cost-effective model
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
            gamesCustomFields_gameType: sanitizeForLegacyCsv(enrichedData.gameType || '') || game.gamesCustomFields_gameType,
            'gamesCustomFields_Theme': sanitizeForLegacyCsv(enrichedData.theme?.join(', ') || '') || game['gamesCustomFields_Theme'],
            gamesCustomFields_features: sanitizeForLegacyCsv(enrichedData.features?.join(', ') || '') || game.gamesCustomFields_features,
            gamesCustomFields_volatility: enrichedData.volatility || game.gamesCustomFields_volatility,
            'gamesCustomFields_Paylines': sanitizeForLegacyCsv(enrichedData.lines || '') || game['gamesCustomFields_Paylines'],
            gamesCustomFields_reels: sanitizeForLegacyCsv(enrichedData.reels || '') || game.gamesCustomFields_reels,
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
  }, [processedData, apiKey, enrichmentLanguage]);


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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-2 selection:bg-sky-500 selection:text-white">
      <Header title={APP_TITLE} subtitle="Paste tab-separated game data from Monday.com." />
      
      <main className="w-full max-w-5xl mt-2 space-y-4">
        <section className="bg-slate-800 p-4 rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold text-[#66acde] mb-2">1. API Configuration</h2>
          <ApiKeyInput value={apiKey} onChange={setApiKey} />
        </section>

        <section className="bg-slate-800 p-4 rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold text-[#66acde] mb-2">2. Paste Game Data</h2>
          <p className="text-slate-400 mb-2 text-xs">Input to include: Name, Game Provider, IMS Game Code, Portrait Tile, and Landscape tile.</p>
          <TextInputArea
            value={rawText}
            onChange={setRawText}
            rows={6}
            placeholder={`Paste your tab-separated game data here. Ensure the first row contains all necessary headers. ${PLACEHOLDER_INFO_REQUIRED_COLUMNS}`}
          />
          <div className="my-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="flex items-center">
              <input
                id="isGameNew"
                type="checkbox"
                checked={isGameNew}
                onChange={(e) => setIsGameNew(e.target.checked)}
                className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-sky-600 focus:ring-sky-500"
                aria-describedby="isGameNewLabel"
              />
              <label id="isGameNewLabel" htmlFor="isGameNew" className="ml-2 block text-sm text-slate-300">
                Add "New" Tag
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="isMaintenanceMode"
                type="checkbox"
                checked={isMaintenanceMode}
                onChange={(e) => setIsMaintenanceMode(e.target.checked)}
                className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-sky-600 focus:ring-sky-500"
                aria-describedby="isMaintenanceModeLabel"
              />
              <label id="isMaintenanceModeLabel" htmlFor="isMaintenanceMode" className="ml-2 block text-sm text-slate-300">
                Maintenance Mode
              </label>
            </div>
            <div className="flex items-center">
              <label htmlFor="language" className="block text-sm text-slate-300 mr-2 shrink-0">
                AI Language:
              </label>
              <select
                id="language"
                name="language"
                value={enrichmentLanguage}
                onChange={(e) => setEnrichmentLanguage(e.target.value)}
                className="w-full rounded-md border-slate-600 bg-slate-700 py-2 pl-3 pr-8 text-slate-100 text-sm focus:ring-sky-500 focus:border-sky-500"
              >
                <option>Canadian English</option>
                <option>American English</option>
                <option>Mexican Spanish</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 items-center">
            <ActionButton
              onClick={() => handleProcessData(GAME_PROVIDER_TO_FOLDER_MAP_CA, ".MX")}
              disabled={isLoading || !rawText.trim()}
              className="bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:text-slate-500 transition-colors"
              icon={<ProcessIcon />}
            >
              {isLoading ? 'Processing...' : 'Process Data'}
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
          <section className="bg-red-800 p-3 rounded-lg shadow-md text-red-100 text-sm">
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
          <section className="bg-slate-800 p-4 rounded-lg shadow-xl">
            <div className="flex items-center mb-3">
              <TableIcon className="w-6 h-6 text-[#66acde] mr-2" />
              <h2 className="text-xl font-semibold text-[#66acde]">3. Processed Data Preview</h2>
            </div>
            <DataTable data={processedData} columns={OUTPUT_CSV_COLUMNS} />
             <div className="flex flex-wrap gap-4 mt-4">
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
            <section className="bg-slate-800 p-4 rounded-lg shadow-xl text-center">
                 <p className="text-slate-400">No data to display. Please check your input or click one of the process buttons. If you've processed data and see this, there might have been no valid rows meeting criteria.</p>
            </section>
        )}
      </main>
       <footer className="w-full max-w-5xl mt-6 py-4 border-t border-slate-700 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Created by Bob Fox. Built with React & Tailwind CSS.</p>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);