import {
  CalendarEvent,
  DailyCheckIn,
  IntegrationConnections,
  MusicMoodMatch,
  MoodEventCorrelation,
  WearableMoodCorrelation,
  WearableSample,
  WeatherMoodPoint,
} from '../types';

const STORAGE_KEYS = {
  connections: 'aetheria_integrations_connections',
  calendarEvents: 'aetheria_integrations_calendar_events',
  wearableSamples: 'aetheria_integrations_wearables',
};

const DEFAULT_CONNECTIONS: IntegrationConnections = {
  calendar: null,
  music: null,
  wearable: null,
  therapy: [],
  weather: false,
};

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op
  }
}

function day(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toISOString().split('T')[0];
}

function moodLabel(mood: number): string {
  if (mood <= 2) return 'grounding';
  if (mood <= 3) return 'balanced';
  if (mood <= 4) return 'uplifting';
  return 'euphoric';
}

function buildMusicQuery(mood: number, emotions: string[]): string {
  const topEmotion = emotions[0]?.toLowerCase() || 'mindful';
  const label = moodLabel(mood);
  return `${label} ${topEmotion} wellness playlist`;
}

export const integrationService = {
  getConnections(): IntegrationConnections {
    return safeRead<IntegrationConnections>(STORAGE_KEYS.connections, DEFAULT_CONNECTIONS);
  },

  updateConnections(updates: Partial<IntegrationConnections>): IntegrationConnections {
    const next = {
      ...this.getConnections(),
      ...updates,
    };
    safeWrite(STORAGE_KEYS.connections, next);
    return next;
  },

  getCalendarEvents(): CalendarEvent[] {
    return safeRead<CalendarEvent[]>(STORAGE_KEYS.calendarEvents, []);
  },

  addCalendarEvents(events: Omit<CalendarEvent, 'id'>[]): CalendarEvent[] {
    const existing = this.getCalendarEvents();
    const mapped: CalendarEvent[] = events.map((event) => ({
      ...event,
      id: `${event.date}-${event.title}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }));
    const next = [...mapped, ...existing].slice(0, 400);
    safeWrite(STORAGE_KEYS.calendarEvents, next);
    return next;
  },

  getCalendarMoodCorrelations(checkIns: DailyCheckIn[]): MoodEventCorrelation[] {
    const events = this.getCalendarEvents();
    return checkIns
      .map((checkIn) => ({
        date: checkIn.date,
        mood: checkIn.mood,
        events: events.filter((event) => event.date === checkIn.date),
      }))
      .filter((row) => row.events.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  getMusicMoodMatch(
    mood: number,
    emotions: string[],
    provider: 'spotify' | 'apple-music'
  ): MusicMoodMatch {
    const query = buildMusicQuery(mood, emotions);
    const encoded = encodeURIComponent(query);
    const url =
      provider === 'spotify'
        ? `https://open.spotify.com/search/${encoded}`
        : `https://music.apple.com/us/search?term=${encoded}`;

    return {
      provider,
      moodLabel: moodLabel(mood),
      query,
      url,
    };
  },

  getWearableSamples(): WearableSample[] {
    return safeRead<WearableSample[]>(STORAGE_KEYS.wearableSamples, []);
  },

  addWearableSample(sample: Omit<WearableSample, 'id'>): WearableSample[] {
    const existing = this.getWearableSamples();
    const next: WearableSample[] = [
      {
        ...sample,
        id: `${sample.source}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      },
      ...existing,
    ].slice(0, 1000);

    safeWrite(STORAGE_KEYS.wearableSamples, next);
    return next;
  },

  getWearableMoodCorrelations(checkIns: DailyCheckIn[]): WearableMoodCorrelation[] {
    const samples = this.getWearableSamples();

    return checkIns
      .map((checkIn) => {
        const byDate = samples.filter((sample) => day(sample.recordedAt) === checkIn.date);
        if (byDate.length === 0) return null;
        const averageHeartRate = byDate.reduce((sum, sample) => sum + sample.heartRate, 0) / byDate.length;
        return {
          date: checkIn.date,
          mood: checkIn.mood,
          averageHeartRate: Number(averageHeartRate.toFixed(1)),
          sampleCount: byDate.length,
        };
      })
      .filter((row): row is WearableMoodCorrelation => !!row)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  createTherapyExport(
    checkIns: DailyCheckIn[],
    platform: 'betterhelp' | 'talkspace',
    format: 'json' | 'csv'
  ): { filename: string; blob: Blob } {
    const normalized = checkIns
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((checkIn) => ({
        date: checkIn.date,
        mood: checkIn.mood,
        emotions: checkIn.emotions.join(', '),
        note: checkIn.note || '',
      }));

    const timestamp = day(new Date());
    const base = `aetheria-${platform}-export-${timestamp}`;

    if (format === 'csv') {
      const header = 'date,mood,emotions,note';
      const lines = normalized.map((row) => {
        const safe = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
        return [safe(row.date), safe(row.mood), safe(row.emotions), safe(row.note)].join(',');
      });
      return {
        filename: `${base}.csv`,
        blob: new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' }),
      };
    }

    const payload = {
      platform,
      exportedAt: new Date().toISOString(),
      totalEntries: normalized.length,
      entries: normalized,
    };

    return {
      filename: `${base}.json`,
      blob: new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }),
    };
  },

  async fetchWeatherMoodCorrelations(
    checkIns: DailyCheckIn[],
    latitude: number,
    longitude: number
  ): Promise<WeatherMoodPoint[]> {
    if (checkIns.length === 0) return [];

    const dates = checkIns.map((item) => item.date).sort();
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      start_date: startDate,
      end_date: endDate,
      daily: 'temperature_2m_mean,precipitation_sum,weather_code',
      timezone: 'auto',
    });

    const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Unable to fetch weather history');
    }

    const data = await response.json();
    const daily = data.daily || {};
    const datesList: string[] = daily.time || [];
    const tempList: Array<number | null> = daily.temperature_2m_mean || [];
    const rainList: Array<number | null> = daily.precipitation_sum || [];
    const codeList: Array<number | null> = daily.weather_code || [];

    const weatherByDate = new Map<string, { t: number | null; p: number | null; c: number | null }>();
    for (let index = 0; index < datesList.length; index++) {
      weatherByDate.set(datesList[index], {
        t: tempList[index] ?? null,
        p: rainList[index] ?? null,
        c: codeList[index] ?? null,
      });
    }

    return checkIns
      .map((checkIn) => {
        const weather = weatherByDate.get(checkIn.date);
        return {
          date: checkIn.date,
          mood: checkIn.mood,
          temperatureC: weather?.t ?? null,
          precipitationMm: weather?.p ?? null,
          weatherCode: weather?.c ?? null,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  },
};