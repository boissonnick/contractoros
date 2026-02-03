/**
 * Weather Service
 *
 * Provides weather forecast data for schedule planning.
 * Falls back to mock data when no API key is configured.
 *
 * Includes construction-specific risk assessment for projects and phases.
 */

import {
  WeatherForecast,
  WeatherCondition as TypesWeatherCondition,
  WeatherImpact,
  WeatherRiskAssessment,
  WeatherRiskFactor,
  WeatherRiskLevel,
  DailyWeatherForecast,
  ProjectWeatherForecast,
  TRADE_WEATHER_THRESHOLDS,
  Project,
  Phase,
} from '@/types';

const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

export type WeatherCondition = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rain' | 'snow' | 'storm';

export interface WeatherData {
  date: string;
  dayOfWeek: string;
  high: number;
  low: number;
  precipitation: number; // percentage
  conditions: WeatherCondition;
  icon: string;
  description: string;
  windSpeed: number;
  humidity: number;
}

export interface WeatherAlert {
  type: 'heat' | 'cold' | 'rain' | 'storm' | 'wind';
  severity: 'advisory' | 'warning' | 'emergency';
  message: string;
  startTime: Date;
  endTime: Date;
}

export interface HourlyWeather {
  hour: number;
  temp: number;
  conditions: WeatherCondition;
  precipitation: number;
  windSpeed: number;
}

/**
 * Get weather forecast for a location
 * Falls back to mock data if no API key is configured
 */
export async function getWeatherForecast(
  lat: number,
  lng: number,
  days: number = 7
): Promise<WeatherData[]> {
  // If no API key, return mock data for demo
  if (!WEATHER_API_KEY) {
    return getMockWeatherData(days);
  }

  try {
    const response = await fetch(
      `${WEATHER_API_BASE}/forecast?lat=${lat}&lon=${lng}&cnt=${days * 8}&appid=${WEATHER_API_KEY}&units=imperial`
    );

    if (!response.ok) {
      console.warn('Weather API error, using mock data');
      return getMockWeatherData(days);
    }

    const data = await response.json();
    return transformWeatherData(data, days);
  } catch (error) {
    console.error('Weather fetch error:', error);
    return getMockWeatherData(days);
  }
}

/**
 * Get hourly weather for a specific date
 */
export async function getHourlyWeather(
  lat: number,
  lng: number,
  date: Date
): Promise<HourlyWeather[]> {
  // Mock hourly data for demo
  const hours: HourlyWeather[] = [];
  const baseTemp = 55 + Math.random() * 20;

  for (let hour = 6; hour <= 20; hour++) {
    // Temperature curve: cooler morning, peak afternoon, cooling evening
    const hourOffset = hour - 6;
    const tempVariation = Math.sin((hourOffset / 14) * Math.PI) * 15;

    hours.push({
      hour,
      temp: Math.round(baseTemp + tempVariation),
      conditions: getConditionForHour(hour, date),
      precipitation: Math.round(Math.random() * 30),
      windSpeed: Math.round(5 + Math.random() * 10),
    });
  }

  return hours;
}

function getConditionForHour(hour: number, date: Date): WeatherCondition {
  // Use date to seed consistent conditions for the same day
  const seed = date.getDate() + date.getMonth();
  const conditions: WeatherCondition[] = ['sunny', 'partly_cloudy', 'cloudy', 'rain'];
  const baseIndex = seed % conditions.length;

  // Morning often clearer
  if (hour < 10) {
    return conditions[Math.max(0, baseIndex - 1)] || 'sunny';
  }

  return conditions[baseIndex];
}

/**
 * Generate mock weather data for demo purposes
 */
function getMockWeatherData(days: number): WeatherData[] {
  const conditions: WeatherCondition[] = ['sunny', 'partly_cloudy', 'cloudy', 'rain', 'sunny', 'partly_cloudy'];
  const descriptions: Record<WeatherCondition, string> = {
    sunny: 'Clear sky',
    partly_cloudy: 'Partly cloudy',
    cloudy: 'Overcast clouds',
    rain: 'Light rain',
    snow: 'Light snow',
    storm: 'Thunderstorm',
  };

  const result: WeatherData[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    // Use day of month to generate consistent but varied weather
    const dayOfMonth = date.getDate();
    const conditionIndex = (dayOfMonth + i) % conditions.length;
    const condition = conditions[conditionIndex];

    // Generate temperature based on "season" (using current month)
    const month = date.getMonth();
    const seasonalBase = month >= 5 && month <= 8 ? 75 : month >= 11 || month <= 2 ? 45 : 60;
    const dailyVariation = (dayOfMonth % 10) - 5;

    const high = seasonalBase + dailyVariation + Math.round(Math.random() * 10);
    const low = high - 15 - Math.round(Math.random() * 10);

    result.push({
      date: date.toISOString().split('T')[0],
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
      high,
      low,
      precipitation: condition === 'rain' ? 60 + Math.round(Math.random() * 30) :
                     condition === 'storm' ? 80 + Math.round(Math.random() * 20) :
                     Math.round(Math.random() * 20),
      conditions: condition,
      icon: getIconCode(condition),
      description: descriptions[condition],
      windSpeed: Math.round(5 + Math.random() * 15),
      humidity: Math.round(40 + Math.random() * 40),
    });
  }

  return result;
}

function getIconCode(condition: WeatherCondition): string {
  const iconMap: Record<WeatherCondition, string> = {
    sunny: '01d',
    partly_cloudy: '02d',
    cloudy: '03d',
    rain: '10d',
    snow: '13d',
    storm: '11d',
  };
  return iconMap[condition];
}

/**
 * Transform OpenWeatherMap API response to our format
 */
function transformWeatherData(data: any, days: number): WeatherData[] {
  const dailyData: Map<string, { temps: number[]; conditions: string[]; precip: number[] }> = new Map();

  // Group by date
  for (const item of data.list) {
    const date = item.dt_txt.split(' ')[0];
    if (!dailyData.has(date)) {
      dailyData.set(date, { temps: [], conditions: [], precip: [] });
    }
    const day = dailyData.get(date)!;
    day.temps.push(item.main.temp);
    day.conditions.push(item.weather[0].main);
    day.precip.push(item.pop * 100);
  }

  const result: WeatherData[] = [];
  let count = 0;

  const entries = Array.from(dailyData.entries());
  for (const [dateStr, day] of entries) {
    if (count >= days) break;

    const date = new Date(dateStr);
    const condition = mapCondition(getMostCommon(day.conditions));

    result.push({
      date: dateStr,
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
      high: Math.round(Math.max(...day.temps)),
      low: Math.round(Math.min(...day.temps)),
      precipitation: Math.round(Math.max(...day.precip)),
      conditions: condition,
      icon: getIconCode(condition),
      description: getMostCommon(day.conditions),
      windSpeed: 10, // Simplified
      humidity: 50,  // Simplified
    });

    count++;
  }

  return result;
}

function getMostCommon(arr: string[]): string {
  const counts = new Map<string, number>();
  for (const item of arr) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  let maxCount = 0;
  let result = arr[0];
  const entries = Array.from(counts.entries());
  for (const [item, count] of entries) {
    if (count > maxCount) {
      maxCount = count;
      result = item;
    }
  }
  return result;
}

function mapCondition(apiCondition: string): WeatherCondition {
  const conditionMap: Record<string, WeatherCondition> = {
    'Clear': 'sunny',
    'Clouds': 'cloudy',
    'Few clouds': 'partly_cloudy',
    'Scattered clouds': 'partly_cloudy',
    'Broken clouds': 'cloudy',
    'Overcast clouds': 'cloudy',
    'Rain': 'rain',
    'Drizzle': 'rain',
    'Snow': 'snow',
    'Thunderstorm': 'storm',
  };
  return conditionMap[apiCondition] || 'partly_cloudy';
}

/**
 * Check if weather conditions warrant an alert
 */
export function shouldShowWeatherAlert(weather: WeatherData): WeatherAlert | null {
  if (weather.conditions === 'storm') {
    return {
      type: 'storm',
      severity: 'warning',
      message: 'Storm expected - consider rescheduling outdoor work',
      startTime: new Date(weather.date),
      endTime: new Date(weather.date),
    };
  }

  if (weather.precipitation > 70) {
    return {
      type: 'rain',
      severity: 'advisory',
      message: `High chance of rain (${weather.precipitation}%) - plan indoor activities`,
      startTime: new Date(weather.date),
      endTime: new Date(weather.date),
    };
  }

  if (weather.high > 95) {
    return {
      type: 'heat',
      severity: 'warning',
      message: 'Extreme heat expected - ensure crew hydration and breaks',
      startTime: new Date(weather.date),
      endTime: new Date(weather.date),
    };
  }

  if (weather.low < 32) {
    return {
      type: 'cold',
      severity: 'advisory',
      message: 'Freezing temperatures - take precautions for cold weather work',
      startTime: new Date(weather.date),
      endTime: new Date(weather.date),
    };
  }

  if (weather.windSpeed > 25) {
    return {
      type: 'wind',
      severity: 'advisory',
      message: `High winds expected (${weather.windSpeed} mph) - secure materials and equipment`,
      startTime: new Date(weather.date),
      endTime: new Date(weather.date),
    };
  }

  return null;
}

/**
 * Get weather condition icon emoji
 */
export function getWeatherEmoji(condition: WeatherCondition): string {
  const emojiMap: Record<WeatherCondition, string> = {
    sunny: '☀️',
    partly_cloudy: '⛅',
    cloudy: '☁️',
    rain: '🌧️',
    snow: '❄️',
    storm: '⛈️',
  };
  return emojiMap[condition];
}

/**
 * Determine if outdoor work should be avoided
 */
export function isOutdoorWorkRisky(weather: WeatherData): boolean {
  return (
    weather.conditions === 'storm' ||
    weather.precipitation > 60 ||
    weather.high > 100 ||
    weather.low < 20 ||
    weather.windSpeed > 30
  );
}

// ============================================
// Extended Weather Service Types
// ============================================

/**
 * Current weather condition with detailed metrics
 */
export interface CurrentWeatherCondition {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy';
  description: string;
  icon: string;
}

/**
 * Daily forecast with sunrise/sunset
 */
export interface DailyForecast {
  date: Date;
  high: number;
  low: number;
  condition: CurrentWeatherCondition['condition'];
  precipChance: number;
  sunrise: string;
  sunset: string;
}

/**
 * Weather alert/warning
 */
export interface ExtendedWeatherAlert {
  id: string;
  type: 'warning' | 'watch' | 'advisory';
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  expires: Date;
}

/**
 * Complete weather data package
 */
export interface ExtendedWeatherData {
  location: string;
  current: CurrentWeatherCondition;
  hourly: Array<CurrentWeatherCondition & { time: Date }>;
  daily: DailyForecast[];
  alerts: ExtendedWeatherAlert[];
  lastUpdated: Date;
}

// ============================================
// Rate Limiting & Caching
// ============================================

// Cache for weather data (30 minutes)
const weatherCache = new Map<string, { data: ExtendedWeatherData; timestamp: number }>();
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// Rate limiting
const rateLimitState = {
  requestCount: 0,
  windowStart: Date.now(),
  maxRequests: 60, // OpenWeatherMap free tier: 60 calls/minute
  windowMs: 60 * 1000, // 1 minute window
};

/**
 * Check if we can make an API request (rate limiting)
 */
function canMakeRequest(): boolean {
  const now = Date.now();

  // Reset window if expired
  if (now - rateLimitState.windowStart > rateLimitState.windowMs) {
    rateLimitState.requestCount = 0;
    rateLimitState.windowStart = now;
  }

  return rateLimitState.requestCount < rateLimitState.maxRequests;
}

/**
 * Record a request for rate limiting
 */
function recordRequest(): void {
  rateLimitState.requestCount++;
}

/**
 * Get cache key for coordinates
 */
function getCacheKey(lat: number, lng: number): string {
  // Round to 2 decimal places to allow some proximity caching
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

/**
 * Get cached weather data if still valid
 */
function getCachedWeather(cacheKey: string): ExtendedWeatherData | null {
  const cached = weatherCache.get(cacheKey);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION_MS;
  if (isExpired) {
    weatherCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

/**
 * Store weather data in cache
 */
function cacheWeather(cacheKey: string, data: ExtendedWeatherData): void {
  weatherCache.set(cacheKey, { data, timestamp: Date.now() });
}

// ============================================
// Extended Weather Service Functions
// ============================================

/**
 * Map internal condition to simplified condition type
 */
function mapToSimpleCondition(condition: WeatherCondition): CurrentWeatherCondition['condition'] {
  const mapping: Record<WeatherCondition, CurrentWeatherCondition['condition']> = {
    sunny: 'sunny',
    partly_cloudy: 'cloudy',
    cloudy: 'cloudy',
    rain: 'rainy',
    snow: 'snowy',
    storm: 'stormy',
  };
  return mapping[condition] || 'cloudy';
}

/**
 * Get weather data by coordinates
 * Falls back to mock data when no API key is configured
 */
export async function getWeatherByCoords(lat: number, lng: number): Promise<ExtendedWeatherData> {
  const cacheKey = getCacheKey(lat, lng);

  // Check cache first
  const cached = getCachedWeather(cacheKey);
  if (cached) {
    return cached;
  }

  // Check rate limit
  if (!canMakeRequest()) {
    console.warn('Rate limit reached, using mock data');
    return generateMockExtendedWeatherData('Location');
  }

  // If no API key, return mock data
  if (!WEATHER_API_KEY) {
    return generateMockExtendedWeatherData('Location');
  }

  try {
    recordRequest();

    // Fetch current weather
    const currentResponse = await fetch(
      `${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=imperial`
    );

    // Fetch forecast
    const forecastResponse = await fetch(
      `${WEATHER_API_BASE}/forecast?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=imperial`
    );

    if (!currentResponse.ok || !forecastResponse.ok) {
      console.warn('Weather API error, using mock data');
      return generateMockExtendedWeatherData('Location');
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    const weatherData = transformToExtendedWeatherData(currentData, forecastData);
    cacheWeather(cacheKey, weatherData);

    return weatherData;
  } catch (error) {
    console.error('Weather fetch error:', error);
    return generateMockExtendedWeatherData('Location');
  }
}

/**
 * Get weather data by ZIP code
 * TODO: Implement ZIP code to coordinates conversion
 */
export async function getWeatherByZip(zip: string): Promise<ExtendedWeatherData> {
  // If no API key, return mock data
  if (!WEATHER_API_KEY) {
    return generateMockExtendedWeatherData(`ZIP: ${zip}`);
  }

  // Check rate limit
  if (!canMakeRequest()) {
    console.warn('Rate limit reached, using mock data');
    return generateMockExtendedWeatherData(`ZIP: ${zip}`);
  }

  try {
    recordRequest();

    // OpenWeatherMap supports direct ZIP code queries
    const currentResponse = await fetch(
      `${WEATHER_API_BASE}/weather?zip=${zip},us&appid=${WEATHER_API_KEY}&units=imperial`
    );

    if (!currentResponse.ok) {
      console.warn('Weather API error, using mock data');
      return generateMockExtendedWeatherData(`ZIP: ${zip}`);
    }

    const currentData = await currentResponse.json();

    // Get forecast using coordinates from current weather response
    const { lat, lon } = currentData.coord;
    return getWeatherByCoords(lat, lon);
  } catch (error) {
    console.error('Weather fetch error:', error);
    return generateMockExtendedWeatherData(`ZIP: ${zip}`);
  }
}

/**
 * Get weather data by city name
 * TODO: Implement city name to coordinates conversion
 */
export async function getWeatherByCity(city: string, state?: string): Promise<ExtendedWeatherData> {
  const location = state ? `${city}, ${state}` : city;

  // If no API key, return mock data
  if (!WEATHER_API_KEY) {
    return generateMockExtendedWeatherData(location);
  }

  // Check rate limit
  if (!canMakeRequest()) {
    console.warn('Rate limit reached, using mock data');
    return generateMockExtendedWeatherData(location);
  }

  try {
    recordRequest();

    const query = state ? `${city},${state},us` : `${city},us`;
    const currentResponse = await fetch(
      `${WEATHER_API_BASE}/weather?q=${encodeURIComponent(query)}&appid=${WEATHER_API_KEY}&units=imperial`
    );

    if (!currentResponse.ok) {
      console.warn('Weather API error, using mock data');
      return generateMockExtendedWeatherData(location);
    }

    const currentData = await currentResponse.json();

    // Get forecast using coordinates from current weather response
    const { lat, lon } = currentData.coord;
    return getWeatherByCoords(lat, lon);
  } catch (error) {
    console.error('Weather fetch error:', error);
    return generateMockExtendedWeatherData(location);
  }
}

// ============================================
// Construction-Specific Helper Functions
// ============================================

/**
 * Determine if current weather conditions are good for outdoor construction work
 *
 * @param weather - Current weather condition
 * @returns true if conditions are favorable for work
 */
export function isGoodWorkingWeather(weather: CurrentWeatherCondition): boolean {
  // Temperature: 40-90°F is acceptable
  const tempOk = weather.temp >= 40 && weather.temp <= 90;

  // Wind: Under 20 mph for most work
  const windOk = weather.windSpeed < 20;

  // Conditions: No rain, snow, or storms
  const conditionOk = ['sunny', 'cloudy', 'foggy'].includes(weather.condition);

  // Humidity: 20-80% is acceptable
  const humidityOk = weather.humidity >= 20 && weather.humidity <= 80;

  return tempOk && windOk && conditionOk && humidityOk;
}

/**
 * Get the overall risk level for construction work based on weather
 *
 * @param weather - Current weather condition
 * @returns Risk level: 'low', 'medium', or 'high'
 */
export function getWeatherRiskLevel(weather: CurrentWeatherCondition): 'low' | 'medium' | 'high' {
  let riskScore = 0;

  // Temperature risks
  if (weather.temp > 95 || weather.temp < 32) {
    riskScore += 3; // Extreme temperatures
  } else if (weather.temp > 90 || weather.temp < 40) {
    riskScore += 1; // Uncomfortable but workable
  }

  // Wind risks
  if (weather.windSpeed >= 30) {
    riskScore += 3; // Dangerous for crane/lift work
  } else if (weather.windSpeed >= 25) {
    riskScore += 2; // High wind warning
  } else if (weather.windSpeed >= 20) {
    riskScore += 1; // Caution needed
  }

  // Condition risks
  if (weather.condition === 'stormy') {
    riskScore += 4; // Lightning risk - stop all outdoor work
  } else if (weather.condition === 'rainy' || weather.condition === 'snowy') {
    riskScore += 2; // Delays likely
  }

  // Humidity risks (very high humidity + heat = heat stroke risk)
  if (weather.humidity > 80 && weather.temp > 85) {
    riskScore += 2;
  }

  // Determine overall risk
  if (riskScore >= 4) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
}

/**
 * Analyze forecast to determine if outdoor work should be delayed
 * Considers multiple days of forecast data
 *
 * @param forecast - Array of daily forecasts
 * @returns Object with delay recommendation and reason
 */
export function shouldDelayOutdoorWork(forecast: DailyForecast[]): { delay: boolean; reason?: string } {
  if (forecast.length === 0) {
    return { delay: false };
  }

  // Check today's forecast (first day)
  const today = forecast[0];

  // Immediate delay conditions
  if (today.condition === 'stormy') {
    return {
      delay: true,
      reason: 'Thunderstorm expected - lightning risk. Delay all outdoor work.'
    };
  }

  if (today.precipChance >= 80) {
    return {
      delay: true,
      reason: `Very high chance of precipitation (${today.precipChance}%). Consider delaying exterior work.`
    };
  }

  if (today.high > 100) {
    return {
      delay: true,
      reason: `Extreme heat expected (${today.high}°F). Delay outdoor work or schedule for early morning.`
    };
  }

  if (today.low < 20) {
    return {
      delay: true,
      reason: `Extreme cold expected (${today.low}°F). Delay concrete work and protect exposed plumbing.`
    };
  }

  // Warning conditions (not immediate delay but should plan)
  if (today.condition === 'snowy') {
    return {
      delay: true,
      reason: 'Snow expected. Most outdoor work not recommended.'
    };
  }

  if (today.high > 95) {
    return {
      delay: false,
      reason: `Heat advisory (${today.high}°F). Ensure crew has frequent water breaks and shade.`
    };
  }

  if (today.precipChance >= 50) {
    return {
      delay: false,
      reason: `${today.precipChance}% chance of rain. Have tarps ready for materials.`
    };
  }

  if (today.low < 32) {
    return {
      delay: false,
      reason: `Freezing temperatures (${today.low}°F). Concrete curing may be affected.`
    };
  }

  return { delay: false };
}

// ============================================
// Data Transformation & Mock Data Generation
// ============================================

/**
 * Transform OpenWeatherMap API response to ExtendedWeatherData
 */
function transformToExtendedWeatherData(currentData: any, forecastData: any): ExtendedWeatherData {
  // Map condition ID to simple condition
  const conditionId = currentData.weather[0]?.id || 800;
  const simpleCondition = mapWeatherIdToCondition(conditionId);

  const current: CurrentWeatherCondition = {
    temp: Math.round(currentData.main.temp),
    feelsLike: Math.round(currentData.main.feels_like),
    humidity: currentData.main.humidity,
    windSpeed: Math.round(currentData.wind.speed),
    windDirection: getWindDirectionFromDegrees(currentData.wind.deg),
    condition: simpleCondition,
    description: currentData.weather[0]?.description || 'Unknown',
    icon: currentData.weather[0]?.icon || '01d',
  };

  // Process hourly from forecast (3-hour intervals)
  const hourly: Array<CurrentWeatherCondition & { time: Date }> = forecastData.list
    .slice(0, 8) // Next 24 hours (8 * 3-hour intervals)
    .map((item: any) => ({
      temp: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      windSpeed: Math.round(item.wind.speed),
      windDirection: getWindDirectionFromDegrees(item.wind.deg),
      condition: mapWeatherIdToCondition(item.weather[0]?.id || 800),
      description: item.weather[0]?.description || 'Unknown',
      icon: item.weather[0]?.icon || '01d',
      time: new Date(item.dt * 1000),
    }));

  // Process daily forecast (group by day)
  const dailyMap = new Map<string, any[]>();
  forecastData.list.forEach((item: any) => {
    const date = new Date(item.dt * 1000).toDateString();
    if (!dailyMap.has(date)) {
      dailyMap.set(date, []);
    }
    dailyMap.get(date)!.push(item);
  });

  const daily: DailyForecast[] = Array.from(dailyMap.entries())
    .slice(0, 5)
    .map(([dateStr, items]) => {
      const temps = items.map((i: any) => i.main.temp);
      const pops = items.map((i: any) => i.pop * 100);
      const conditions = items.map((i: any) => i.weather[0]?.id || 800);

      // Get most severe condition for the day
      const worstCondition = conditions.reduce((worst: number, curr: number) => {
        return getConditionSeverity(curr) > getConditionSeverity(worst) ? curr : worst;
      }, 800);

      return {
        date: new Date(dateStr),
        high: Math.round(Math.max(...temps)),
        low: Math.round(Math.min(...temps)),
        condition: mapWeatherIdToCondition(worstCondition),
        precipChance: Math.round(Math.max(...pops)),
        sunrise: '6:30 AM', // TODO: Get from API with timezone consideration
        sunset: '6:00 PM',
      };
    });

  return {
    location: currentData.name || 'Unknown Location',
    current,
    hourly,
    daily,
    alerts: [], // TODO: Implement alerts endpoint when available
    lastUpdated: new Date(),
  };
}

/**
 * Map OpenWeatherMap weather ID to simple condition
 */
function mapWeatherIdToCondition(id: number): CurrentWeatherCondition['condition'] {
  // Thunderstorm: 200-299
  if (id >= 200 && id < 300) return 'stormy';
  // Drizzle/Rain: 300-599
  if (id >= 300 && id < 600) return 'rainy';
  // Snow: 600-699
  if (id >= 600 && id < 700) return 'snowy';
  // Atmosphere (fog, mist): 700-799
  if (id >= 700 && id < 800) return 'foggy';
  // Clear: 800
  if (id === 800) return 'sunny';
  // Clouds: 801-804
  return 'cloudy';
}

/**
 * Get condition severity for comparison (higher = worse)
 */
function getConditionSeverity(id: number): number {
  if (id >= 200 && id < 300) return 4; // Thunderstorm
  if (id >= 500 && id < 600) return 3; // Rain
  if (id >= 600 && id < 700) return 3; // Snow
  if (id >= 300 && id < 400) return 2; // Drizzle
  if (id >= 700 && id < 800) return 1; // Fog
  if (id >= 801 && id < 900) return 0; // Clouds
  return 0; // Clear
}

/**
 * Convert wind degrees to cardinal direction
 */
function getWindDirectionFromDegrees(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Generate mock extended weather data for demo/development
 */
function generateMockExtendedWeatherData(location: string): ExtendedWeatherData {
  const now = new Date();
  const baseTemp = 65 + Math.random() * 20;

  const conditions: CurrentWeatherCondition['condition'][] = ['sunny', 'cloudy', 'rainy', 'sunny', 'cloudy'];
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

  const current: CurrentWeatherCondition = {
    temp: Math.round(baseTemp),
    feelsLike: Math.round(baseTemp - 2 + Math.random() * 4),
    humidity: Math.round(40 + Math.random() * 40),
    windSpeed: Math.round(5 + Math.random() * 15),
    windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
    condition: randomCondition,
    description: getDescriptionForCondition(randomCondition),
    icon: getIconForCondition(randomCondition),
  };

  // Generate hourly forecast
  const hourly: Array<CurrentWeatherCondition & { time: Date }> = [];
  for (let i = 0; i < 8; i++) {
    const hourTime = new Date(now.getTime() + i * 3 * 60 * 60 * 1000);
    const hourTemp = baseTemp + Math.sin((now.getHours() + i * 3) / 24 * Math.PI) * 10;
    hourly.push({
      ...current,
      temp: Math.round(hourTemp),
      feelsLike: Math.round(hourTemp - 2),
      time: hourTime,
    });
  }

  // Generate daily forecast
  const daily: DailyForecast[] = [];
  for (let i = 0; i < 5; i++) {
    const dayDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dayBaseTemp = baseTemp + (Math.random() - 0.5) * 15;
    const dayCondition = conditions[(i + Math.floor(Math.random() * 2)) % conditions.length];

    daily.push({
      date: dayDate,
      high: Math.round(dayBaseTemp + 10),
      low: Math.round(dayBaseTemp - 10),
      condition: dayCondition,
      precipChance: dayCondition === 'rainy' ? 60 + Math.round(Math.random() * 30) : Math.round(Math.random() * 20),
      sunrise: '6:30 AM',
      sunset: '6:00 PM',
    });
  }

  return {
    location,
    current,
    hourly,
    daily,
    alerts: [],
    lastUpdated: now,
  };
}

/**
 * Get weather description for condition
 */
function getDescriptionForCondition(condition: CurrentWeatherCondition['condition']): string {
  const descriptions: Record<CurrentWeatherCondition['condition'], string> = {
    sunny: 'Clear sky',
    cloudy: 'Partly cloudy',
    rainy: 'Light rain',
    stormy: 'Thunderstorm',
    snowy: 'Light snow',
    foggy: 'Foggy',
  };
  return descriptions[condition];
}

/**
 * Get icon code for condition
 */
function getIconForCondition(condition: CurrentWeatherCondition['condition']): string {
  const icons: Record<CurrentWeatherCondition['condition'], string> = {
    sunny: '01d',
    cloudy: '03d',
    rainy: '10d',
    stormy: '11d',
    snowy: '13d',
    foggy: '50d',
  };
  return icons[condition];
}

/**
 * Clear the weather cache (useful for testing)
 */
export function clearWeatherCache(): void {
  weatherCache.clear();
}

/**
 * Get rate limit status (useful for debugging)
 */
export function getRateLimitStatus(): { remaining: number; resetIn: number } {
  const now = Date.now();
  const elapsed = now - rateLimitState.windowStart;
  const remaining = rateLimitState.maxRequests - rateLimitState.requestCount;
  const resetIn = Math.max(0, rateLimitState.windowMs - elapsed);

  return { remaining, resetIn };
}

// ============================================
// Construction Project Weather Integration
// ============================================

// These functions integrate with the types system for construction-specific
// weather risk assessment used by projects and phases.

interface OpenWeatherResponse {
  list: {
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: {
      id: number;
      main: string;
      description: string;
    }[];
    wind: {
      speed: number;
      deg: number;
    };
    pop: number; // Probability of precipitation
    rain?: { '3h': number };
    snow?: { '3h': number };
  }[];
  city: {
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
  };
}

/**
 * Map OpenWeatherMap condition codes to typed weather conditions
 */
function mapTypedWeatherCondition(weatherId: number, temp: number): TypesWeatherCondition {
  // Thunderstorm (200-299)
  if (weatherId >= 200 && weatherId < 300) return 'storm';

  // Drizzle and Rain (300-399, 500-599)
  if (weatherId >= 300 && weatherId < 400) return 'rain';
  if (weatherId >= 500 && weatherId < 510) return 'rain';
  if (weatherId >= 510 && weatherId < 600) return 'heavy_rain';

  // Snow (600-699)
  if (weatherId >= 600 && weatherId < 700) return 'snow';

  // Atmosphere (fog, mist, etc.) - treat as cloudy
  if (weatherId >= 700 && weatherId < 800) return 'cloudy';

  // Clear (800)
  if (weatherId === 800) {
    // Check for extreme temperatures
    if (temp >= 100) return 'extreme_heat';
    if (temp <= 20) return 'extreme_cold';
    return 'clear';
  }

  // Clouds (801-804)
  if (weatherId === 801 || weatherId === 802) return 'partly_cloudy';
  if (weatherId >= 803) return 'cloudy';

  return 'partly_cloudy';
}

/**
 * Determine wind direction from degrees (8 directions)
 */
function getWindDirectionCardinal(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Assess weather impact on construction work
 */
function assessWeatherImpact(
  condition: TypesWeatherCondition,
  tempHigh: number,
  tempLow: number,
  precipitation: number,
  windSpeed: number
): { impact: WeatherImpact; notes: string; affectedTrades: string[] } {
  const affectedTrades: string[] = [];
  let impact: WeatherImpact = 'none';
  let notes = '';

  // Check severe conditions first
  if (condition === 'storm' || condition === 'heavy_rain') {
    impact = 'severe';
    notes = 'Work not recommended due to severe weather.';
    affectedTrades.push('all outdoor trades');
    return { impact, notes, affectedTrades };
  }

  if (condition === 'extreme_heat') {
    impact = 'high';
    notes = `Extreme heat (${Math.round(tempHigh)}°F). Limit outdoor work, ensure hydration.`;
    affectedTrades.push('roofing', 'concrete', 'framing', 'landscaping');
    return { impact, notes, affectedTrades };
  }

  if (condition === 'extreme_cold') {
    impact = 'high';
    notes = `Extreme cold (${Math.round(tempLow)}°F). Concrete and paint work not recommended.`;
    affectedTrades.push('concrete', 'painting', 'masonry', 'landscaping');
    return { impact, notes, affectedTrades };
  }

  // Check rain
  if (condition === 'rain' || precipitation >= 50) {
    impact = 'moderate';
    notes = `Rain expected (${precipitation}% chance). Plan for delays.`;
    affectedTrades.push('roofing', 'painting', 'concrete', 'landscaping');
  }

  // Check snow
  if (condition === 'snow') {
    impact = 'high';
    notes = 'Snow expected. Most outdoor work not recommended.';
    affectedTrades.push('roofing', 'concrete', 'painting', 'landscaping', 'framing');
    return { impact, notes, affectedTrades };
  }

  // Check high winds (> 25 mph)
  if (windSpeed > 25) {
    if (impact === 'none') impact = 'moderate';
    notes += ` High winds (${Math.round(windSpeed)} mph).`;
    if (!affectedTrades.includes('roofing')) affectedTrades.push('roofing');
    affectedTrades.push('crane work', 'scaffolding');
  }

  // Check temperature for specific work
  if (tempHigh < 40 && impact === 'none') {
    impact = 'low';
    notes = `Cold temperatures (${Math.round(tempLow)}°-${Math.round(tempHigh)}°F). Concrete and paint curing affected.`;
    affectedTrades.push('concrete', 'painting');
  }

  if (tempHigh > 90 && impact === 'none') {
    impact = 'low';
    notes = `Hot temperatures (${Math.round(tempHigh)}°F). Plan for heat breaks.`;
  }

  if (!notes) {
    notes = 'Good working conditions expected.';
  }

  return { impact, notes, affectedTrades };
}

/**
 * Fetch 5-day weather forecast for a location (construction-specific format)
 */
export async function fetchWeatherForecast(
  lat: number,
  lng: number,
  orgId: string
): Promise<WeatherForecast[]> {
  if (!WEATHER_API_KEY) {
    console.warn('OpenWeatherMap API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `${WEATHER_API_BASE}/forecast?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=imperial`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data: OpenWeatherResponse = await response.json();
    const forecasts: WeatherForecast[] = [];
    const processedDates = new Set<string>();

    for (const item of data.list) {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toDateString();

      // Only process one forecast per day (noon-ish)
      if (processedDates.has(dateStr)) continue;

      const hour = date.getHours();
      if (hour < 10 || hour > 14) continue;

      processedDates.add(dateStr);

      const condition = mapTypedWeatherCondition(
        item.weather[0].id,
        item.main.temp_max
      );

      const { impact, notes, affectedTrades } = assessWeatherImpact(
        condition,
        item.main.temp_max,
        item.main.temp_min,
        Math.round(item.pop * 100),
        item.wind.speed
      );

      forecasts.push({
        id: `weather-${dateStr}`,
        orgId,
        location: data.city.name,
        coordinates: {
          lat: data.city.coord.lat,
          lng: data.city.coord.lon,
        },
        date,
        condition,
        tempHigh: item.main.temp_max,
        tempLow: item.main.temp_min,
        precipitation: Math.round(item.pop * 100),
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        windDirection: getWindDirectionCardinal(item.wind.deg),
        impact,
        impactNotes: notes,
        affectedTrades,
        source: 'openweathermap',
        fetchedAt: new Date(),
      });
    }

    return forecasts;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return [];
  }
}

/**
 * Generate mock weather data for development/demo (construction-specific format)
 */
export function generateMockWeatherForecast(
  location: string,
  orgId: string,
  days: number = 7
): WeatherForecast[] {
  const forecasts: WeatherForecast[] = [];
  const conditions: TypesWeatherCondition[] = [
    'clear',
    'partly_cloudy',
    'cloudy',
    'rain',
    'clear',
    'partly_cloudy',
    'rain',
  ];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(12, 0, 0, 0);

    const condition = conditions[i % conditions.length];
    const baseTemp = 70 + Math.random() * 20 - 10;
    const tempHigh = baseTemp + 5;
    const tempLow = baseTemp - 10;
    const precipitation = condition === 'rain' ? 60 + Math.random() * 30 : Math.random() * 20;
    const windSpeed = 5 + Math.random() * 15;

    const { impact, notes, affectedTrades } = assessWeatherImpact(
      condition,
      tempHigh,
      tempLow,
      precipitation,
      windSpeed
    );

    forecasts.push({
      id: `weather-mock-${date.toDateString()}`,
      orgId,
      location,
      coordinates: { lat: 34.0522, lng: -118.2437 }, // Default to LA
      date,
      condition,
      tempHigh,
      tempLow,
      precipitation: Math.round(precipitation),
      humidity: 50 + Math.random() * 30,
      windSpeed: Math.round(windSpeed),
      windDirection: 'NW',
      impact,
      impactNotes: notes,
      affectedTrades,
      source: 'mock',
      fetchedAt: new Date(),
    });
  }

  return forecasts;
}

/**
 * Get weather summary for a date range
 */
export function getWeatherSummary(forecasts: WeatherForecast[]): {
  goodDays: number;
  moderateDays: number;
  badDays: number;
  summary: string;
} {
  let goodDays = 0;
  let moderateDays = 0;
  let badDays = 0;

  forecasts.forEach((f) => {
    if (f.impact === 'none' || f.impact === 'low') goodDays++;
    else if (f.impact === 'moderate') moderateDays++;
    else badDays++;
  });

  let summary = '';
  if (badDays > 0) {
    summary = `${badDays} day${badDays > 1 ? 's' : ''} with poor conditions expected.`;
  } else if (moderateDays > 0) {
    summary = `${moderateDays} day${moderateDays > 1 ? 's' : ''} may have some delays.`;
  } else {
    summary = 'Good working conditions for the week.';
  }

  return { goodDays, moderateDays, badDays, summary };
}

// ============================================
// Project-Specific Weather Risk Assessment
// ============================================

/**
 * Calculate risk level based on threshold violations
 */
function calculateRiskLevel(violations: number): WeatherRiskLevel {
  if (violations >= 4) return 'severe';
  if (violations >= 3) return 'high';
  if (violations >= 2) return 'moderate';
  if (violations >= 1) return 'low';
  return 'none';
}

/**
 * Assess weather risk for specific trades based on thresholds
 */
export function assessTradeWeatherRisk(
  trade: string,
  temperature: number,
  precipitation: number,
  windSpeed: number
): { riskLevel: WeatherRiskLevel; factors: WeatherRiskFactor[] } {
  const thresholds = TRADE_WEATHER_THRESHOLDS[trade.toLowerCase()];
  const factors: WeatherRiskFactor[] = [];

  if (!thresholds) {
    // Unknown trade - use general assessment
    return assessGeneralWeatherRisk(temperature, precipitation, windSpeed);
  }

  // Check temperature thresholds
  if (thresholds.minTemp !== undefined && temperature < thresholds.minTemp) {
    factors.push({
      type: 'cold',
      severity: temperature < thresholds.minTemp - 20 ? 'severe' :
               temperature < thresholds.minTemp - 10 ? 'high' : 'moderate',
      description: `Temperature ${Math.round(temperature)}°F below minimum ${thresholds.minTemp}°F for ${trade}`,
      threshold: `Min temp: ${thresholds.minTemp}°F`,
    });
  }

  if (thresholds.maxTemp !== undefined && temperature > thresholds.maxTemp) {
    factors.push({
      type: 'heat',
      severity: temperature > thresholds.maxTemp + 20 ? 'severe' :
               temperature > thresholds.maxTemp + 10 ? 'high' : 'moderate',
      description: `Temperature ${Math.round(temperature)}°F above maximum ${thresholds.maxTemp}°F for ${trade}`,
      threshold: `Max temp: ${thresholds.maxTemp}°F`,
    });
  }

  // Check wind thresholds
  if (thresholds.maxWind !== undefined && windSpeed > thresholds.maxWind) {
    factors.push({
      type: 'wind',
      severity: windSpeed > thresholds.maxWind + 20 ? 'severe' :
               windSpeed > thresholds.maxWind + 10 ? 'high' : 'moderate',
      description: `Wind speed ${Math.round(windSpeed)} mph exceeds maximum ${thresholds.maxWind} mph for ${trade}`,
      threshold: `Max wind: ${thresholds.maxWind} mph`,
    });
  }

  // Check precipitation thresholds
  if (thresholds.maxPrecipitation !== undefined && precipitation > thresholds.maxPrecipitation) {
    factors.push({
      type: 'precipitation',
      severity: precipitation > thresholds.maxPrecipitation + 40 ? 'severe' :
               precipitation > thresholds.maxPrecipitation + 20 ? 'high' : 'moderate',
      description: `${precipitation}% precipitation chance exceeds maximum ${thresholds.maxPrecipitation}% for ${trade}`,
      threshold: `Max precipitation: ${thresholds.maxPrecipitation}%`,
    });
  }

  // Calculate overall risk level
  const highSeverityCount = factors.filter(f => f.severity === 'severe' || f.severity === 'high').length;
  const riskLevel = calculateRiskLevel(highSeverityCount > 0 ? highSeverityCount + 1 : factors.length);

  return { riskLevel, factors };
}

/**
 * General weather risk assessment when trade is unknown
 */
export function assessGeneralWeatherRisk(
  temperature: number,
  precipitation: number,
  windSpeed: number
): { riskLevel: WeatherRiskLevel; factors: WeatherRiskFactor[] } {
  const factors: WeatherRiskFactor[] = [];

  // Temperature extremes
  if (temperature <= 20) {
    factors.push({
      type: 'cold',
      severity: 'severe',
      description: `Extreme cold: ${Math.round(temperature)}°F`,
      threshold: 'Temp <= 20°F',
    });
  } else if (temperature <= 32) {
    factors.push({
      type: 'cold',
      severity: 'high',
      description: `Freezing temperature: ${Math.round(temperature)}°F`,
      threshold: 'Temp <= 32°F',
    });
  } else if (temperature < 40) {
    factors.push({
      type: 'cold',
      severity: 'moderate',
      description: `Cold temperature: ${Math.round(temperature)}°F`,
      threshold: 'Temp < 40°F',
    });
  }

  if (temperature >= 100) {
    factors.push({
      type: 'heat',
      severity: 'severe',
      description: `Extreme heat: ${Math.round(temperature)}°F`,
      threshold: 'Temp >= 100°F',
    });
  } else if (temperature >= 95) {
    factors.push({
      type: 'heat',
      severity: 'high',
      description: `Dangerous heat: ${Math.round(temperature)}°F`,
      threshold: 'Temp >= 95°F',
    });
  } else if (temperature > 90) {
    factors.push({
      type: 'heat',
      severity: 'moderate',
      description: `Hot temperature: ${Math.round(temperature)}°F`,
      threshold: 'Temp > 90°F',
    });
  }

  // Precipitation
  if (precipitation >= 80) {
    factors.push({
      type: 'precipitation',
      severity: 'severe',
      description: `Very high precipitation chance: ${precipitation}%`,
      threshold: 'Precip >= 80%',
    });
  } else if (precipitation >= 60) {
    factors.push({
      type: 'precipitation',
      severity: 'high',
      description: `High precipitation chance: ${precipitation}%`,
      threshold: 'Precip >= 60%',
    });
  } else if (precipitation >= 40) {
    factors.push({
      type: 'precipitation',
      severity: 'moderate',
      description: `Moderate precipitation chance: ${precipitation}%`,
      threshold: 'Precip >= 40%',
    });
  }

  // Wind
  if (windSpeed >= 40) {
    factors.push({
      type: 'wind',
      severity: 'severe',
      description: `Dangerous winds: ${Math.round(windSpeed)} mph`,
      threshold: 'Wind >= 40 mph',
    });
  } else if (windSpeed >= 30) {
    factors.push({
      type: 'wind',
      severity: 'high',
      description: `High winds: ${Math.round(windSpeed)} mph`,
      threshold: 'Wind >= 30 mph',
    });
  } else if (windSpeed >= 20) {
    factors.push({
      type: 'wind',
      severity: 'moderate',
      description: `Windy conditions: ${Math.round(windSpeed)} mph`,
      threshold: 'Wind >= 20 mph',
    });
  }

  const highSeverityCount = factors.filter(f => f.severity === 'severe' || f.severity === 'high').length;
  const riskLevel = calculateRiskLevel(highSeverityCount > 0 ? highSeverityCount + 1 : factors.length);

  return { riskLevel, factors };
}

/**
 * Get recommended actions based on risk factors
 */
function getRecommendedActions(factors: WeatherRiskFactor[], trades: string[]): string[] {
  const actions: string[] = [];

  const hasSevereRisk = factors.some(f => f.severity === 'severe');
  const hasHighRisk = factors.some(f => f.severity === 'high');
  const hasWindRisk = factors.some(f => f.type === 'wind');
  const hasPrecipRisk = factors.some(f => f.type === 'precipitation');
  const hasColdRisk = factors.some(f => f.type === 'cold');
  const hasHeatRisk = factors.some(f => f.type === 'heat');

  if (hasSevereRisk) {
    actions.push('Consider postponing outdoor work');
    actions.push('Monitor weather updates closely');
  }

  if (hasWindRisk) {
    actions.push('Secure loose materials and equipment');
    if (trades.some(t => ['roofing', 'framing', 'siding'].includes(t.toLowerCase()))) {
      actions.push('Delay elevated work until wind subsides');
    }
  }

  if (hasPrecipRisk) {
    actions.push('Prepare tarps and covers for exposed materials');
    if (trades.some(t => ['concrete', 'painting', 'masonry'].includes(t.toLowerCase()))) {
      actions.push('Reschedule weather-sensitive finishing work');
    }
  }

  if (hasColdRisk) {
    actions.push('Ensure workers have cold weather gear');
    if (trades.some(t => ['concrete', 'masonry'].includes(t.toLowerCase()))) {
      actions.push('Use cold weather concrete additives or delay pour');
    }
    if (trades.some(t => ['plumbing'].includes(t.toLowerCase()))) {
      actions.push('Protect exposed pipes from freezing');
    }
  }

  if (hasHeatRisk) {
    actions.push('Schedule frequent water and shade breaks');
    actions.push('Move heavy work to early morning hours');
    if (hasHighRisk) {
      actions.push('Monitor workers for heat exhaustion symptoms');
    }
  }

  return actions;
}

/**
 * Estimate delay hours based on risk level
 */
function estimateDelayHours(riskLevel: WeatherRiskLevel): number {
  switch (riskLevel) {
    case 'severe': return 8; // Full day
    case 'high': return 4;
    case 'moderate': return 2;
    case 'low': return 0.5;
    default: return 0;
  }
}

/**
 * Assess weather risk for a specific project and its active phases
 */
export function assessProjectWeatherRisk(
  project: Pick<Project, 'id' | 'name'>,
  phases: Pick<Phase, 'id' | 'name' | 'trades'>[],
  forecast: WeatherForecast
): WeatherRiskAssessment {
  // Collect all active trades from phases
  const allTrades: string[] = [];
  phases.forEach((phase: Pick<Phase, 'id' | 'name' | 'trades'>) => {
    if (phase.trades) {
      allTrades.push(...phase.trades);
    }
  });
  const uniqueTrades = Array.from(new Set(allTrades));

  // Assess risk for each trade
  const allFactors: WeatherRiskFactor[] = [];
  const affectedTrades: string[] = [];

  if (uniqueTrades.length > 0) {
    uniqueTrades.forEach(trade => {
      const { riskLevel, factors } = assessTradeWeatherRisk(
        trade,
        forecast.tempHigh,
        forecast.precipitation,
        forecast.windSpeed
      );

      if (factors.length > 0) {
        affectedTrades.push(trade);
        factors.forEach(f => {
          // Avoid duplicate factors
          if (!allFactors.some(af => af.type === f.type && af.severity === f.severity)) {
            allFactors.push(f);
          }
        });
      }
    });
  } else {
    // Use general assessment if no trades specified
    const { factors } = assessGeneralWeatherRisk(
      forecast.tempHigh,
      forecast.precipitation,
      forecast.windSpeed
    );
    allFactors.push(...factors);
  }

  // Sort factors by severity
  const severityOrder: Record<WeatherRiskLevel, number> = {
    severe: 4,
    high: 3,
    moderate: 2,
    low: 1,
    none: 0,
  };
  allFactors.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

  // Calculate overall risk
  const highSeverityCount = allFactors.filter(f => f.severity === 'severe' || f.severity === 'high').length;
  const overallRisk = calculateRiskLevel(highSeverityCount > 0 ? highSeverityCount + 1 : allFactors.length);

  return {
    projectId: project.id,
    projectName: project.name,
    forecastDate: forecast.date,
    condition: forecast.condition,
    temperature: forecast.tempHigh,
    precipitation: forecast.precipitation,
    windSpeed: forecast.windSpeed,
    humidity: forecast.humidity,
    overallRisk,
    riskFactors: allFactors,
    affectedTrades,
    recommendedActions: getRecommendedActions(allFactors, affectedTrades),
    estimatedDelayHours: estimateDelayHours(overallRisk),
    shouldPauseWork: overallRisk === 'severe' || overallRisk === 'high',
  };
}

/**
 * Assess weather risk for a specific phase
 */
export function assessPhaseWeatherRisk(
  project: Pick<Project, 'id' | 'name'>,
  phase: Pick<Phase, 'id' | 'name' | 'trades'>,
  forecast: WeatherForecast
): WeatherRiskAssessment {
  const trades = phase.trades || [];
  const allFactors: WeatherRiskFactor[] = [];
  const affectedTrades: string[] = [];

  if (trades.length > 0) {
    trades.forEach(trade => {
      const { factors } = assessTradeWeatherRisk(
        trade,
        forecast.tempHigh,
        forecast.precipitation,
        forecast.windSpeed
      );

      if (factors.length > 0) {
        affectedTrades.push(trade);
        factors.forEach(f => {
          if (!allFactors.some(af => af.type === f.type && af.severity === f.severity)) {
            allFactors.push(f);
          }
        });
      }
    });
  } else {
    const { factors } = assessGeneralWeatherRisk(
      forecast.tempHigh,
      forecast.precipitation,
      forecast.windSpeed
    );
    allFactors.push(...factors);
  }

  const severityOrder: Record<WeatherRiskLevel, number> = {
    severe: 4,
    high: 3,
    moderate: 2,
    low: 1,
    none: 0,
  };
  allFactors.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

  const highSeverityCount = allFactors.filter(f => f.severity === 'severe' || f.severity === 'high').length;
  const overallRisk = calculateRiskLevel(highSeverityCount > 0 ? highSeverityCount + 1 : allFactors.length);

  return {
    projectId: project.id,
    projectName: project.name,
    phaseId: phase.id,
    phaseName: phase.name,
    forecastDate: forecast.date,
    condition: forecast.condition,
    temperature: forecast.tempHigh,
    precipitation: forecast.precipitation,
    windSpeed: forecast.windSpeed,
    humidity: forecast.humidity,
    overallRisk,
    riskFactors: allFactors,
    affectedTrades,
    recommendedActions: getRecommendedActions(allFactors, affectedTrades),
    estimatedDelayHours: estimateDelayHours(overallRisk),
    shouldPauseWork: overallRisk === 'severe' || overallRisk === 'high',
  };
}

/**
 * Create a project weather forecast with risk assessments
 */
export function createProjectWeatherForecast(
  project: Pick<Project, 'id' | 'name' | 'address'>,
  phases: Pick<Phase, 'id' | 'name' | 'trades'>[],
  forecasts: WeatherForecast[]
): ProjectWeatherForecast {
  // Collect all trades
  const allTrades: string[] = [];
  phases.forEach((phase: Pick<Phase, 'id' | 'name' | 'trades'>) => {
    if (phase.trades) {
      allTrades.push(...phase.trades);
    }
  });
  const uniqueTrades = Array.from(new Set(allTrades));

  // Process each forecast day
  const dailyForecasts: DailyWeatherForecast[] = forecasts.map(forecast => {
    const allFactors: WeatherRiskFactor[] = [];

    if (uniqueTrades.length > 0) {
      uniqueTrades.forEach((trade: string) => {
        const { factors } = assessTradeWeatherRisk(
          trade,
          forecast.tempHigh,
          forecast.precipitation,
          forecast.windSpeed
        );
        factors.forEach(f => {
          if (!allFactors.some(af => af.type === f.type && af.severity === f.severity)) {
            allFactors.push(f);
          }
        });
      });
    } else {
      const { factors } = assessGeneralWeatherRisk(
        forecast.tempHigh,
        forecast.precipitation,
        forecast.windSpeed
      );
      allFactors.push(...factors);
    }

    const highSeverityCount = allFactors.filter(f => f.severity === 'severe' || f.severity === 'high').length;
    const riskLevel = calculateRiskLevel(highSeverityCount > 0 ? highSeverityCount + 1 : allFactors.length);

    return {
      date: forecast.date,
      condition: forecast.condition,
      highTemp: forecast.tempHigh,
      lowTemp: forecast.tempLow,
      precipitation: forecast.precipitation,
      windSpeed: forecast.windSpeed,
      windDirection: forecast.windDirection,
      humidity: forecast.humidity,
      riskLevel,
      riskFactors: allFactors,
    };
  });

  // Count high risk days
  const highRiskDays = dailyForecasts.filter(f =>
    f.riskLevel === 'high' || f.riskLevel === 'severe'
  ).length;

  // Find next risky day
  const nextRiskyForecast = dailyForecasts.find(f =>
    f.riskLevel === 'high' || f.riskLevel === 'severe'
  );

  // Format address for display
  const addressString = typeof project.address === 'object' && project.address
    ? `${project.address.street}, ${project.address.city}, ${project.address.state}`
    : undefined;

  return {
    projectId: project.id,
    projectName: project.name,
    projectAddress: addressString,
    forecasts: dailyForecasts,
    highRiskDays,
    nextRiskyDay: nextRiskyForecast?.date,
    fetchedAt: new Date(),
  };
}

/**
 * Get weather risk badge color for UI
 */
export function getWeatherRiskColor(level: WeatherRiskLevel): string {
  switch (level) {
    case 'severe': return '#7c2d12'; // orange-900
    case 'high': return '#ef4444'; // red-500
    case 'moderate': return '#f59e0b'; // amber-500
    case 'low': return '#22c55e'; // green-500
    case 'none': return '#10b981'; // emerald-500
    default: return '#6b7280'; // gray-500
  }
}

/**
 * Get weather risk badge background for UI
 */
export function getWeatherRiskBackground(level: WeatherRiskLevel): string {
  switch (level) {
    case 'severe': return 'bg-orange-900 text-white';
    case 'high': return 'bg-red-100 text-red-800';
    case 'moderate': return 'bg-amber-100 text-amber-800';
    case 'low': return 'bg-green-100 text-green-800';
    case 'none': return 'bg-emerald-100 text-emerald-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get weather condition icon name (for Heroicons)
 */
export function getWeatherConditionIcon(condition: TypesWeatherCondition): string {
  switch (condition) {
    case 'clear': return 'sun';
    case 'partly_cloudy': return 'cloud';
    case 'cloudy': return 'cloud';
    case 'rain': return 'cloud-rain';
    case 'heavy_rain': return 'cloud-rain';
    case 'storm': return 'bolt';
    case 'snow': return 'snow';
    case 'extreme_heat': return 'fire';
    case 'extreme_cold': return 'snow';
    default: return 'cloud';
  }
}
