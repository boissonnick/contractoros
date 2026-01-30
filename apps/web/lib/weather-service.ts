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
  WeatherRiskAssessment,
  WeatherRiskFactor,
  WeatherRiskLevel,
  DailyWeatherForecast,
  ProjectWeatherForecast,
  TRADE_WEATHER_THRESHOLDS,
  Project,
  Phase,
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
      threshold: 'Temp ≤ 20°F',
    });
  } else if (temperature <= 32) {
    factors.push({
      type: 'cold',
      severity: 'high',
      description: `Freezing temperature: ${Math.round(temperature)}°F`,
      threshold: 'Temp ≤ 32°F',
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
      threshold: 'Temp ≥ 100°F',
    });
  } else if (temperature >= 95) {
    factors.push({
      type: 'heat',
      severity: 'high',
      description: `Dangerous heat: ${Math.round(temperature)}°F`,
      threshold: 'Temp ≥ 95°F',
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
      threshold: 'Precip ≥ 80%',
    });
  } else if (precipitation >= 60) {
    factors.push({
      type: 'precipitation',
      severity: 'high',
      description: `High precipitation chance: ${precipitation}%`,
      threshold: 'Precip ≥ 60%',
    });
  } else if (precipitation >= 40) {
    factors.push({
      type: 'precipitation',
      severity: 'moderate',
      description: `Moderate precipitation chance: ${precipitation}%`,
      threshold: 'Precip ≥ 40%',
    });
  }

  // Wind
  if (windSpeed >= 40) {
    factors.push({
      type: 'wind',
      severity: 'severe',
      description: `Dangerous winds: ${Math.round(windSpeed)} mph`,
      threshold: 'Wind ≥ 40 mph',
    });
  } else if (windSpeed >= 30) {
    factors.push({
      type: 'wind',
      severity: 'high',
      description: `High winds: ${Math.round(windSpeed)} mph`,
      threshold: 'Wind ≥ 30 mph',
    });
  } else if (windSpeed >= 20) {
    factors.push({
      type: 'wind',
      severity: 'moderate',
      description: `Windy conditions: ${Math.round(windSpeed)} mph`,
      threshold: 'Wind ≥ 20 mph',
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
export function getWeatherConditionIcon(condition: WeatherCondition): string {
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
