/**
 * Weather Service
 *
 * Provides weather forecast data for schedule planning.
 * Falls back to mock data when no API key is configured.
 */

const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
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
