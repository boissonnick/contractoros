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
