
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

const JFT_URL = 'https://www.na.org.au/just-for-today/';
const JFT_CACHE_KEY_PREFIX = 'jft_reading_';

interface JFTReading {
  content: string;
  date: string;
}

/**
 * Extract first two complete sentences from text
 * Ensures we don't cut mid-sentence
 */
export const getFirstTwoSentences = (text: string): string => {
  // Match sentences ending with . ! or ?
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  if (sentences.length >= 2) {
    return (sentences[0] + sentences[1]).trim();
  }
  
  // If less than 2 sentences, return all available text
  return text.trim();
};

/**
 * Fetch Just For Today reading from backend API
 * Note: Direct HTML scraping is forbidden - this should call a backend endpoint
 * For now, this is a placeholder that will need backend integration
 */
const fetchJustForToday = async (dateKey: string): Promise<string | null> => {
  try {
    console.log('[JFT Service] Fetching reading for date:', dateKey);
    
    // TODO: Backend Integration - GET /api/just-for-today?date=DD/MM/YYYY
    // Should return: { content: string, date: string }
    // Backend should scrape/parse the NA AU website server-side
    
    // Placeholder: In production, this would call your backend
    // const response = await apiGet<JFTReading>(`/api/just-for-today?date=${dateKey}`);
    // return response.content;
    
    // For now, return null to trigger fallback behavior
    return null;
  } catch (error) {
    console.error('[JFT Service] Error fetching reading:', error);
    return null;
  }
};

/**
 * Get Just For Today reading with caching
 * 1. Check cache for today's date
 * 2. If not cached, fetch from backend
 * 3. If fetch fails, return last cached reading
 * 4. If no cache exists, return null
 */
export const getJFTReading = async (): Promise<string | null> => {
  try {
    const today = new Date();
    const dateKey = format(today, 'dd/MM/yyyy');
    const cacheKey = JFT_CACHE_KEY_PREFIX + dateKey;
    
    console.log('[JFT Service] Getting reading for:', dateKey);
    
    // Check if we have today's reading cached
    const cachedReading = await AsyncStorage.getItem(cacheKey);
    if (cachedReading) {
      console.log('[JFT Service] Found cached reading for today');
      return cachedReading;
    }
    
    // Try to fetch new reading
    console.log('[JFT Service] No cache found, attempting fetch...');
    const fetchedReading = await fetchJustForToday(dateKey);
    
    if (fetchedReading) {
      // Cache the new reading
      await AsyncStorage.setItem(cacheKey, fetchedReading);
      console.log('[JFT Service] Cached new reading');
      return fetchedReading;
    }
    
    // Fetch failed - try to get last cached reading
    console.log('[JFT Service] Fetch failed, looking for last cached reading...');
    const allKeys = await AsyncStorage.getAllKeys();
    const jftKeys = allKeys.filter(key => key.startsWith(JFT_CACHE_KEY_PREFIX));
    
    if (jftKeys.length > 0) {
      // Sort by date (most recent first)
      jftKeys.sort((a, b) => {
        const dateA = a.replace(JFT_CACHE_KEY_PREFIX, '');
        const dateB = b.replace(JFT_CACHE_KEY_PREFIX, '');
        // Simple string comparison works for DD/MM/YYYY format
        return dateB.localeCompare(dateA);
      });
      
      const lastCachedKey = jftKeys[0];
      const lastReading = await AsyncStorage.getItem(lastCachedKey);
      console.log('[JFT Service] Returning last cached reading from:', lastCachedKey);
      return lastReading;
    }
    
    console.log('[JFT Service] No cached readings available');
    return null;
  } catch (error) {
    console.error('[JFT Service] Error in getJFTReading:', error);
    return null;
  }
};

/**
 * Get the Just For Today URL for external opening
 */
export const getJFTUrl = (): string => {
  return JFT_URL;
};
