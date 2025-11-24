import { ProcessedGameData, GameProviderFolderMapping } from '../types.ts';
import { INPUT_HEADER_MAPPINGS, CORE_REQUIRED_INPUT_HEADER_KEYS } from '../constants.ts';

/**
 * Sanitizes a string for legacy systems by removing diacritics (accents)
 * from characters, but leaves other symbols like ™, ®, © intact.
 * For example, 'ió' becomes 'io'.
 * @param text The string to sanitize.
 * @returns The sanitized string.
 */
function sanitizeForLegacyCsv(text: string): string {
    if (typeof text !== 'string' || !text) {
        return '';
    }
    // Use Unicode normalization to separate base characters from their accents.
    // 'NFD' (Normalization Form Canonical Decomposition) splits 'é' into 'e' + '´' (combining accent).
    // The regex /[\u0300-\u036f]/g matches and removes all combining diacritical marks (accents).
    // This handles a wide range of characters like á, é, í, ó, ú, ü, ñ etc., leaving other symbols untouched.
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}


function generateSeoFriendlyName(name: string): string {
  if (!name) return '';
  
  // First, sanitize to handle accented characters.
  const sanitizedName = sanitizeForLegacyCsv(name);

  // Then, create a clean URL-friendly slug.
  return sanitizedName
    .toLowerCase()
    .replace(/&/g, 'and') // Replace ampersand for readability
    .replace(/[^\w\s-]/g, '') // Remove remaining non-alphanumeric chars (like ™), keeping spaces and hyphens
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
    // Case-insensitive header matching
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

    const landscape_layout1x1_mainImage = (tileStatus?.trim().toLowerCase() === 'yes')
        ? `/${baseIconPath}/${gameCode}_l.webp`
        : undefined;
    
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

export function generateCsvContent(
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