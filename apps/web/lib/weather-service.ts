/**
 * Weather Service
 *
 * Fetches weather forecasts and assesses impact on construction work.
 * Uses OpenWeatherMap API (free tier supports 1000 calls/day).
 */

import {
  WeatherForecast,
  WeatherCondition,
  WeatherImpact,
} from '@/types';

// OpenWeatherMap API configuration
const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

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
 * Map OpenWeatherMap condition codes to our weather conditions
 */
function mapWeatherCondition(weatherId: number, temp: number): WeatherCondition {
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
 * Determine wind direction from degrees
 */
function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Assess weather impact on construction work
 */
function assessWeatherImpact(
  condition: WeatherCondition,
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
 * Fetch 5-day weather forecast for a location
 */
export async function fetchWeatherForecast(
  lat: number,
  lng: number,
  orgId: string
): Promise<WeatherForecast[]> {
  if (!OPENWEATHER_API_KEY) {
    console.warn('OpenWeatherMap API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=imperial`
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

      const condition = mapWeatherCondition(
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
        windDirection: getWindDirection(item.wind.deg),
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
 * Generate mock weather data for development/demo
 */
export function generateMockWeatherForecast(
  location: string,
  orgId: string,
  days: number = 7
): WeatherForecast[] {
  const forecasts: WeatherForecast[] = [];
  const conditions: WeatherCondition[] = [
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
