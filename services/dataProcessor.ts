import { ProcessedGameData, GameProviderFolderMapping } from '../types';
import { INPUT_HEADER_MAPPINGS, CORE_REQUIRED_INPUT_HEADER_KEYS } from '../constants';

function generateSeoFriendlyName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/™/g, '') // Remove trademark symbol
    .replace(/®/g, '') // Remove registered symbol
    .replace(/©/g, '') // Remove copyright symbol
    .replace(/%/g, '')  // Remove percentage sign
    .replace(/&/g, 'and') // Replace ampersand
    .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric, keeping spaces and hyphens
    .trim() // Trim leading/trailing whitespace
    .replace(/\s+/g, '-') // Replace spaces (single or multiple) with a single hyphen
    .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
}

function parseBooleanString(value: string | undefined, defaultValue: boolean = false): boolean {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    const lowerValue = value.trim().toLowerCase();
    if (lowerValue === 'true' || lowerValue === '1') {
        return true;
    }
    if (lowerValue === 'false' || lowerValue === '0') {
        return false;
    }
    return defaultValue;
}


export function parsePastedData(
  text: string,
  providerMap: GameProviderFolderMapping // Accept providerMap as an argument
): ProcessedGameData[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    throw new Error("Data must include a header row and at least one data row.");
  }

  const headerCells = lines[0].split('\t').map(cell => cell.trim());
  const headerIndices: { [internalKey: string]: number } = {};
  const missingRequiredHeaders: string[] = [];

  for (const internalKey in INPUT_HEADER_MAPPINGS) {
    const expectedHeader = INPUT_HEADER_MAPPINGS[internalKey as keyof typeof INPUT_HEADER_MAPPINGS];
    const index = headerCells.indexOf(expectedHeader);
    if (index !== -1) {
      headerIndices[internalKey] = index;
    } else {
      if (CORE_REQUIRED_INPUT_HEADER_KEYS.includes(internalKey as keyof typeof INPUT_HEADER_MAPPINGS)) {
        missingRequiredHeaders.push(expectedHeader);
      }
    }
  }

  if (missingRequiredHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingRequiredHeaders.join(', ')}.`);
  }
  
  const processedGames: ProcessedGameData[] = [];

  // This map defines how to rename providers for the final output CSV for providers
  // that don't have special routing (like 'via SG').
  const providerDisplayNameMap: { [key: string]: string } = {
    'pragmatic': 'Pragmatic Play',
    'sg': 'Light and Wonder',
    'peter & sons': 'Peter and Sons',
    'hacksaw': 'Hacksaw',
    'hacksaw openrgs': 'Hacksaw',
  };

  // Helper to process existing image paths to avoid duplicating logic
  const processExistingImagePath = (pathValue: string | undefined): string | undefined => {
      if (!pathValue) return undefined;
      const trimmedPath = pathValue.trim();
      if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
          return trimmedPath;
      }
      let path = trimmedPath;
      // Normalize by removing any leading slash to start clean
      if (path.startsWith('/')) {
          path = path.substring(1);
      }
      // If the path already includes the 'library' root, construct a relative path.
      if (path.toLowerCase().startsWith('library/')) {
          return path;
      } else {
          // Otherwise, prepend 'library/' to make it a relative path
          return `library/${path}`;
      }
  };


  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split('\t');
    
    const getCellValue = (internalKey: keyof typeof INPUT_HEADER_MAPPINGS): string | undefined => {
      const index = headerIndices[internalKey];
      return index !== undefined ? cells[index]?.trim() : undefined;
    };

    const gameCode = getCellValue('GAME_CODE');
    const name = getCellValue('NAME');
    const originalGameProvider = getCellValue('GAME_PROVIDER'); 

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
        
        // Handle specific name cleanups after stripping suffix
        if (finalGameProvider.toLowerCase() === 'high5') {
            finalGameProvider = 'High 5';
        } else if (finalGameProvider.toLowerCase() === 'lightning box') {
            finalGameProvider = 'Lightning Box';
        }

        // ELK Studios has its own folder structure even when distributed via LNW/SG.
        if (finalGameProvider.toLowerCase().startsWith('elk studio')) {
            providerForImageUrl = finalGameProvider;
        } else {
            // Other partners via LNW/SG use the SG folder as a default.
            providerForImageUrl = 'SG';
        }
    } else {
        // Handle all other providers
        finalGameProvider = providerDisplayNameMap[lowerCaseProvider] || originalGameProvider;
        providerForImageUrl = originalGameProvider;
    }


    let seoFriendlyGameName = getCellValue('SEO_FRIENDLY_GAME_NAME');
    if (!seoFriendlyGameName) {
      seoFriendlyGameName = generateSeoFriendlyName(name);
    }
    
    // Common path generation logic
    const folderNameFromMap = providerMap[providerForImageUrl]; // Use the passed providerMap
    const providerFolderName = folderNameFromMap || providerForImageUrl; 
    const encodedFolderName = encodeURIComponent(providerFolderName);
    const baseIconPath = `library/Game%20Icons/${encodedFolderName}`;

    // Default Game Image (Square)
    let defaultGameImage: string;
    const defaultUserImageValue = getCellValue('DEFAULT_USER_IMAGE');
    const processedDefaultUserImage = processExistingImagePath(defaultUserImageValue);
    if (processedDefaultUserImage) {
        defaultGameImage = processedDefaultUserImage;
    } else {
        defaultGameImage = `${baseIconPath}/${gameCode}.webp`;
    }
    
    // Landscape Game Image - Conditional generation
    let landscape_layout1x1_mainImage: string | undefined;
    const landscapeImageValue = getCellValue('LANDSCAPE_LAYOUT_1X1_MAIN_IMAGE');
    const landscapeTileStatus = getCellValue('LANDSCAPE_TILE_STATUS');
    const processedLandscapeImage = processExistingImagePath(landscapeImageValue);
    
    if (processedLandscapeImage) {
        // If an explicit URL is provided in the input, use it.
        landscape_layout1x1_mainImage = processedLandscapeImage;
    } else if (landscapeTileStatus?.trim().toLowerCase() === 'done') {
        // Otherwise, if the status is 'Done', generate the URL.
        landscape_layout1x1_mainImage = `${baseIconPath}/landscape/${gameCode}.webp`;
    }
    // If neither condition is met, it remains undefined (empty).
    
    // Portrait Game Image - Conditional generation
    let portrait_layout1x1_mainImage: string | undefined;
    const portraitImageValue = getCellValue('PORTRAIT_LAYOUT_1X1_MAIN_IMAGE');
    const portraitTileStatus = getCellValue('PORTRAIT_TILE_STATUS');
    const processedPortraitImage = processExistingImagePath(portraitImageValue);
    
    if (processedPortraitImage) {
        // If an explicit URL is provided in the input, use it.
        portrait_layout1x1_mainImage = processedPortraitImage;
    } else if (portraitTileStatus?.trim().toLowerCase() === 'done') {
        // Otherwise, if the status is 'Done', generate the URL.
        portrait_layout1x1_mainImage = `${baseIconPath}/portrait/${gameCode}.webp`;
    }
    // If neither condition is met, it remains undefined (empty).
    
    const mobileGameCode = getCellValue('MOBILE_GAME_CODE') || gameCode;

    let desktopGameTypeFinal = "POP";
    let mobileGameTypeFinal = "POP";
    let liveLaunchAliasValue = getCellValue('LIVE_LAUNCH_ALIAS'); 

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
      gameProvider: finalGameProvider, 
      mobileGameCode,
      seoFriendlyGameName,
      defaultGameImage,
      isActive: true,
      isExcludedFromPGG: parseBooleanString(getCellValue('IS_EXCLUDED_FROM_PGG')),
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
      isGameNew: parseBooleanString(getCellValue('IS_GAME_NEW'), true), 
      isGamePopular: parseBooleanString(getCellValue('IS_GAME_POPULAR')),
      isGameHot: parseBooleanString(getCellValue('IS_GAME_HOT')),
      isGameExclusive: parseBooleanString(getCellValue('IS_GAME_EXCLUSIVE')),

      desktopGameType: desktopGameTypeFinal,
      mobileGameType: mobileGameTypeFinal,
      liveLaunchAlias: liveLaunchAliasValue, 
      bingoGameType: getCellValue('BINGO_GAME_TYPE'),
      vfGameType: getCellValue('RTP_GAME_TYPE'), 
      jackpotCode: getCellValue('JACKPOT_CODE'),
      demoModeSupport: "unavailable", 
      gameMode: "Maintenance", 
      urlCustomParameters: getCellValue('URL_CUSTOM_PARAMETERS'),
      
      landscape_layout1x1_mainImage: landscape_layout1x1_mainImage,
      landscape_layout1x1_mobileImage: getCellValue('LANDSCAPE_LAYOUT_1X1_MOBILE_IMAGE'),
      landscape_layout1x1_guestMainImage: getCellValue('LANDSCAPE_LAYOUT_1X1_GUEST_MAIN_IMAGE'),
      landscape_layout1x1_guestMobileImage: getCellValue('LANDSCAPE_LAYOUT_1X1_GUEST_MOBILE_IMAGE'),
      landscape_layout1x2_mainImage: getCellValue('LANDSCAPE_LAYOUT_1X2_MAIN_IMAGE'),
      landscape_layout1x2_mobileImage: getCellValue('LANDSCAPE_LAYOUT_1X2_MOBILE_IMAGE'),
      landscape_layout1x2_guestMainImage: getCellValue('LANDSCAPE_LAYOUT_1X2_GUEST_MAIN_IMAGE'),
      landscape_layout1x2_guestMobileImage: getCellValue('LANDSCAPE_LAYOUT_1X2_GUEST_MOBILE_IMAGE'),
      landscape_layout2x1_mainImage: getCellValue('LANDSCAPE_LAYOUT_2X1_MAIN_IMAGE'),
      landscape_layout2x1_mobileImage: getCellValue('LANDSCAPE_LAYOUT_2X1_MOBILE_IMAGE'),
      landscape_layout2x1_guestMainImage: getCellValue('LANDSCAPE_LAYOUT_2X1_GUEST_MAIN_IMAGE'),
      landscape_layout2x1_guestMobileImage: getCellValue('LANDSCAPE_LAYOUT_2X1_GUEST_MOBILE_IMAGE'),
      landscape_layout2x2_mainImage: getCellValue('LANDSCAPE_LAYOUT_2X2_MAIN_IMAGE'),
      landscape_layout2x2_mobileImage: getCellValue('LANDSCAPE_LAYOUT_2X2_MOBILE_IMAGE'),
      landscape_layout2x2_guestMainImage: getCellValue('LANDSCAPE_LAYOUT_2X2_GUEST_MAIN_IMAGE'),
      landscape_layout2x2_guestMobileImage: getCellValue('LANDSCAPE_LAYOUT_2X2_GUEST_MOBILE_IMAGE'),
      
      portrait_layout1x1_mainImage: portrait_layout1x1_mainImage,
      portrait_layout1x1_mobileImage: getCellValue('PORTRAIT_LAYOUT_1X1_MOBILE_IMAGE'),
      portrait_layout1x1_guestMainImage: getCellValue('PORTRAIT_LAYOUT_1X1_GUEST_MAIN_IMAGE'),
      portrait_layout1x1_guestMobileImage: getCellValue('PORTRAIT_LAYOUT_1X1_GUEST_MOBILE_IMAGE'),
      portrait_layout1x2_mainImage: getCellValue('PORTRAIT_LAYOUT_1X2_MAIN_IMAGE'),
      portrait_layout1x2_mobileImage: getCellValue('PORTRAIT_LAYOUT_1X2_MOBILE_IMAGE'),
      portrait_layout1x2_guestMainImage: getCellValue('PORTRAIT_LAYOUT_1X2_GUEST_MAIN_IMAGE'),
      portrait_layout1x2_guestMobileImage: getCellValue('PORTRAIT_LAYOUT_1X2_GUEST_MOBILE_IMAGE'),
      portrait_layout2x1_mainImage: getCellValue('PORTRAIT_LAYOUT_2X1_MAIN_IMAGE'),
      portrait_layout2x1_mobileImage: getCellValue('PORTRAIT_LAYOUT_2X1_MOBILE_IMAGE'),
      portrait_layout2x1_guestMainImage: getCellValue('PORTRAIT_LAYOUT_2X1_GUEST_MAIN_IMAGE'),
      portrait_layout2x1_guestMobileImage: getCellValue('PORTRAIT_LAYOUT_2X1_GUEST_MOBILE_IMAGE'),
      portrait_layout2x2_mainImage: getCellValue('PORTRAIT_LAYOUT_2X2_MAIN_IMAGE'),
      portrait_layout2x2_mobileImage: getCellValue('PORTRAIT_LAYOUT_2X2_MOBILE_IMAGE'),
      portrait_layout2x2_guestMainImage: getCellValue('PORTRAIT_LAYOUT_2X2_GUEST_MAIN_IMAGE'),
      portrait_layout2x2_guestMobileImage: getCellValue('PORTRAIT_LAYOUT_2X2_GUEST_MOBILE_IMAGE'),

      square_layout1x1_mainImage: getCellValue('SQUARE_LAYOUT_1X1_MAIN_IMAGE'),
      square_layout1x1_mobileImage: getCellValue('SQUARE_LAYOUT_1X1_MOBILE_IMAGE'),
      square_layout1x1_guestMainImage: getCellValue('SQUARE_LAYOUT_1X1_GUEST_MAIN_IMAGE'),
      square_layout1x1_guestMobileImage: getCellValue('SQUARE_LAYOUT_1X1_GUEST_MOBILE_IMAGE'),
      square_layout1x2_mainImage: getCellValue('SQUARE_LAYOUT_1X2_MAIN_IMAGE'),
      square_layout1x2_mobileImage: getCellValue('SQUARE_LAYOUT_1X2_MOBILE_IMAGE'),
      square_layout1x2_guestMainImage: getCellValue('SQUARE_LAYOUT_1X2_GUEST_MAIN_IMAGE'),
      square_layout1x2_guestMobileImage: getCellValue('SQUARE_LAYOUT_1X2_GUEST_MOBILE_IMAGE'),
      square_layout2x1_mainImage: getCellValue('SQUARE_LAYOUT_2X1_MAIN_IMAGE'),
      square_layout2x1_mobileImage: getCellValue('SQUARE_LAYOUT_2X1_MOBILE_IMAGE'),
      square_layout2x1_guestMainImage: getCellValue('SQUARE_LAYOUT_2X1_GUEST_MAIN_IMAGE'),
      square_layout2x1_guestMobileImage: getCellValue('SQUARE_LAYOUT_2X1_GUEST_MOBILE_IMAGE'),
      square_layout2x2_mainImage: getCellValue('SQUARE_LAYOUT_2X2_MAIN_IMAGE'),
      square_layout2x2_mobileImage: getCellValue('SQUARE_LAYOUT_2X2_MOBILE_IMAGE'),
      square_layout2x2_guestMainImage: getCellValue('SQUARE_LAYOUT_2X2_GUEST_MAIN_IMAGE'),
      square_layout2x2_guestMobileImage: getCellValue('SQUARE_LAYOUT_2X2_GUEST_MOBILE_IMAGE'),
      
      articleId: getCellValue('ARTICLE_ID'),
      mobileArticleId: getCellValue('MOBILE_ARTICLE_ID'),
      description: getCellValue('DESCRIPTION'),
      ['gameLabelsData_Drops and Wins']: getCellValue('GAMELABELS_DROPS_AND_WINS'),
      ['gameLabelsData_Rising Star']: getCellValue('GAMELABELS_RISING_STAR'),
      gameLabelsData_Exclusive: getCellValue('GAMELABELS_EXCLUSIVE'),
      gameLabelsData_New: getCellValue('GAMELABELS_NEW'),
      gamesCustomFields_provider: finalGameProvider,
      gamesCustomFields_externalProviderGameId: getCellValue('GAMESCUSTOMFIELDS_EXTERNALPROVIDERGAMEID'),
      gamesCustomFields_gameType: getCellValue('GAMESCUSTOMFIELDS_GAMETYPE'),
      gamesCustomFields_theme: getCellValue('GAMESCUSTOMFIELDS_THEME'),
      gamesCustomFields_features: getCellValue('GAMESCUSTOMFIELDS_FEATURES'),
      gamesCustomFields_volatility: getCellValue('GAMESCUSTOMFIELDS_VOLATILITY'),
      gamesCustomFields_rtp: getCellValue('GAMESCUSTOMFIELDS_RTP'),
      gamesCustomFields_lines: getCellValue('GAMESCUSTOMFIELDS_LINES'),
      gamesCustomFields_reels: getCellValue('GAMESCUSTOMFIELDS_REELS'),
    };
    processedGames.push(rowData);
  }
  return processedGames;
}

export function generateCsvContent(
  data: ProcessedGameData[],
  columns: (keyof ProcessedGameData | 'gameLabelsData_Drops and Wins' | 'gameLabelsData_Rising Star')[]
): string {
  if (data.length === 0) return '';

  const header = columns.join('\t') + '\n';
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col as keyof ProcessedGameData]; 
      
      if (typeof value === 'boolean') {
        return String(value).toLowerCase();
      }
      let cellValue = (value === undefined || value === null) ? '' : String(value);
      cellValue = cellValue.replace(/\t/g, ' ').replace(/\n/g, ' '); 
      return cellValue;
    }).join('\t');
  }).join('\n');

  return header + rows;
}