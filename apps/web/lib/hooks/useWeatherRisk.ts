/**
 * useWeatherRisk Hook
 *
 * Provides weather forecasts and risk assessments for projects and phases.
 * Uses real weather data when API key is available, falls back to mock data.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  WeatherForecast,
  WeatherRiskAssessment,
  ProjectWeatherForecast,
  Project,
  Phase,
} from '@/types';
import {
  fetchWeatherForecast,
  generateMockWeatherForecast,
  assessPhaseWeatherRisk,
  createProjectWeatherForecast,
  getWeatherSummary,
} from '@/lib/services/weather';
import { logger } from '@/lib/utils/logger';

// Project with coordinates extracted from address
interface ProjectWithCoords {
  id: string;
  name: string;
  address: Project['address'];
}

interface UseWeatherRiskReturn {
  // Data
  forecasts: WeatherForecast[];
  projectForecasts: Map<string, ProjectWeatherForecast>;
  riskAssessments: Map<string, WeatherRiskAssessment>;
  // State
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  // Actions
  fetchForLocation: (lat: number, lng: number, orgId: string) => Promise<WeatherForecast[]>;
  getProjectRisk: (
    project: ProjectWithCoords,
    phases: Pick<Phase, 'id' | 'name' | 'trades'>[]
  ) => Promise<ProjectWeatherForecast | null>;
  getPhaseRisk: (
    project: Pick<Project, 'id' | 'name'>,
    phase: Pick<Phase, 'id' | 'name' | 'trades'>,
    forecast: WeatherForecast
  ) => WeatherRiskAssessment;
  getTodayRisk: (projectId: string) => WeatherRiskAssessment | null;
  getWeekSummary: () => { goodDays: number; moderateDays: number; badDays: number; summary: string };
  clearCache: () => void;
}

// Cache duration: 30 minutes
const CACHE_DURATION_MS = 30 * 60 * 1000;

export function useWeatherRisk(orgId: string | undefined): UseWeatherRiskReturn {
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [projectForecasts, setProjectForecasts] = useState<Map<string, ProjectWeatherForecast>>(new Map());
  const [riskAssessments, setRiskAssessments] = useState<Map<string, WeatherRiskAssessment>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  /**
   * Fetch weather for a specific location
   */
  const fetchForLocation = useCallback(async (
    lat: number,
    lng: number,
    fetchOrgId: string
  ): Promise<WeatherForecast[]> => {
    setLoading(true);
    setError(null);

    try {
      // Check cache
      if (lastFetched && Date.now() - lastFetched.getTime() < CACHE_DURATION_MS) {
        setLoading(false);
        return forecasts;
      }

      // Try real API first
      let weatherData = await fetchWeatherForecast(lat, lng, fetchOrgId);

      // Fall back to mock data if API fails or returns empty
      if (weatherData.length === 0) {
        weatherData = generateMockWeatherForecast('Project Location', fetchOrgId, 7);
      }

      setForecasts(weatherData);
      setLastFetched(new Date());
      setLoading(false);
      return weatherData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather';
      setError(errorMessage);

      // Fall back to mock on error
      const mockData = generateMockWeatherForecast('Project Location', fetchOrgId, 7);
      setForecasts(mockData);
      setLoading(false);
      return mockData;
    }
  }, [forecasts, lastFetched]);

  /**
   * Get weather risk for a project
   */
  const getProjectRisk = useCallback(async (
    project: ProjectWithCoords,
    phases: Pick<Phase, 'id' | 'name' | 'trades'>[]
  ): Promise<ProjectWeatherForecast | null> => {
    if (!orgId) return null;

    // Check cache
    const cached = projectForecasts.get(project.id);
    if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_DURATION_MS) {
      return cached;
    }

    try {
      // Use project coordinates from address or default
      const lat = project.address?.coordinates?.lat || 34.0522;
      const lng = project.address?.coordinates?.lng || -118.2437;

      const weatherData = await fetchForLocation(lat, lng, orgId);

      if (weatherData.length === 0) return null;

      const projectForecast = createProjectWeatherForecast(project, phases, weatherData);

      // Update cache
      setProjectForecasts(prev => new Map(prev).set(project.id, projectForecast));

      return projectForecast;
    } catch (err) {
      logger.error('Error getting project risk', { error: err, hook: 'useWeatherRisk' });
      return null;
    }
  }, [orgId, projectForecasts, fetchForLocation]);

  /**
   * Get weather risk for a specific phase
   */
  const getPhaseRisk = useCallback((
    project: Pick<Project, 'id' | 'name'>,
    phase: Pick<Phase, 'id' | 'name' | 'trades'>,
    forecast: WeatherForecast
  ): WeatherRiskAssessment => {
    const cacheKey = `${project.id}-${phase.id}-${forecast.date.toDateString()}`;

    // Check cache
    const cached = riskAssessments.get(cacheKey);
    if (cached) return cached;

    const assessment = assessPhaseWeatherRisk(project, phase, forecast);

    // Update cache
    setRiskAssessments(prev => new Map(prev).set(cacheKey, assessment));

    return assessment;
  }, [riskAssessments]);

  /**
   * Get today's risk for a project
   */
  const getTodayRisk = useCallback((projectId: string): WeatherRiskAssessment | null => {
    const projectForecast = projectForecasts.get(projectId);
    if (!projectForecast || projectForecast.forecasts.length === 0) return null;

    const today = new Date().toDateString();
    const todayForecast = projectForecast.forecasts.find(
      f => f.date.toDateString() === today
    );

    if (!todayForecast) return null;

    // Convert DailyWeatherForecast to WeatherRiskAssessment
    return {
      projectId,
      projectName: projectForecast.projectName,
      forecastDate: todayForecast.date,
      condition: todayForecast.condition,
      temperature: todayForecast.highTemp,
      precipitation: todayForecast.precipitation,
      windSpeed: todayForecast.windSpeed,
      humidity: todayForecast.humidity,
      overallRisk: todayForecast.riskLevel,
      riskFactors: todayForecast.riskFactors,
      affectedTrades: [],
      recommendedActions: [],
      shouldPauseWork: todayForecast.riskLevel === 'severe' || todayForecast.riskLevel === 'high',
    };
  }, [projectForecasts]);

  /**
   * Get weekly weather summary
   */
  const getWeekSummary = useCallback(() => {
    if (forecasts.length === 0) {
      return { goodDays: 0, moderateDays: 0, badDays: 0, summary: 'No forecast data available.' };
    }
    return getWeatherSummary(forecasts);
  }, [forecasts]);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(() => {
    setForecasts([]);
    setProjectForecasts(new Map());
    setRiskAssessments(new Map());
    setLastFetched(null);
  }, []);

  return {
    forecasts,
    projectForecasts,
    riskAssessments,
    loading,
    error,
    lastFetched,
    fetchForLocation,
    getProjectRisk,
    getPhaseRisk,
    getTodayRisk,
    getWeekSummary,
    clearCache,
  };
}

/**
 * Hook for getting weather risk for a single project
 */
export function useProjectWeatherRisk(
  orgId: string | undefined,
  project: ProjectWithCoords | null,
  phases: Pick<Phase, 'id' | 'name' | 'trades'>[]
) {
  const { getProjectRisk, loading, error } = useWeatherRisk(orgId);
  const [projectForecast, setProjectForecast] = useState<ProjectWeatherForecast | null>(null);

  useEffect(() => {
    if (!project || !orgId) return;

    getProjectRisk(project, phases).then(setProjectForecast);
  }, [project, orgId, phases, getProjectRisk]);

  return {
    forecast: projectForecast,
    loading,
    error,
    refresh: () => project && getProjectRisk(project, phases).then(setProjectForecast),
  };
}
