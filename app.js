// Aether Weather — Live Open-Meteo Forecast & Atmospheric Canvas

const DEFAULT_CITIES = [
  { name: "San Francisco", region: "California, United States", lat: 37.7749, lon: -122.4194 },
  { name: "Tokyo", region: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
  { name: "Reykjavik", region: "Capital Region, Iceland", lat: 64.1466, lon: -21.9426 },
  { name: "Zurich", region: "Zurich, Switzerland", lat: 47.3769, lon: 8.5417 },
  { name: "Mumbai", region: "Maharashtra, India", lat: 19.076, lon: 72.8777 }
];

const WMO_MAP = {
  0: { label: "Clear Sky", icon: "sun", mood: "clear-day" },
  1: { label: "Mainly Clear", icon: "partly", mood: "clear-day" },
  2: { label: "Partly Cloudy", icon: "partly", mood: "clear-day" },
  3: { label: "Overcast", icon: "cloud", mood: "rain" },
  45: { label: "Misty Fog", icon: "fog", mood: "snow" },
  48: { label: "Rime Fog", icon: "fog", mood: "snow" },
  51: { label: "Light Drizzle", icon: "rain", mood: "rain" },
  53: { label: "Drizzle", icon: "rain", mood: "rain" },
  55: { label: "Dense Drizzle", icon: "rain", mood: "rain" },
  61: { label: "Light Rain", icon: "rain", mood: "rain" },
  63: { label: "Steady Rain", icon: "rain", mood: "rain" },
  65: { label: "Heavy Rain", icon: "rain", mood: "rain" },
  71: { label: "Light Snow", icon: "snow", mood: "snow" },
  73: { label: "Snowfall", icon: "snow", mood: "snow" },
  75: { label: "Heavy Snow", icon: "snow", mood: "snow" },
  77: { label: "Snow Grains", icon: "snow", mood: "snow" },
  80: { label: "Rain Showers", icon: "rain", mood: "rain" },
  81: { label: "Moderate Showers", icon: "rain", mood: "rain" },
  82: { label: "Violent Showers", icon: "storm", mood: "rain" },
  85: { label: "Snow Showers", icon: "snow", mood: "snow" },
  86: { label: "Heavy Snow Showers", icon: "snow", mood: "snow" },
  95: { label: "Thunderstorm", icon: "storm", mood: "rain" },
  96: { label: "Storm & Hail", icon: "storm", mood: "rain" },
  99: { label: "Severe Storm", icon: "storm", mood: "rain" }
};

const state = {
  unit: "C",
  moodOverride: "auto",
  activeMood: "clear-day",
  savedCities: loadSavedCities(),
  currentCity: null,
  weatherData: null,
  aqiData: null,
  selectedHourIndex: 0,
  areaTab: "nearby",
  nearbyAreas: [],
  savedWeatherMap: {}
};

const CITY_PALETTES = {
  "san francisco": {
    top: "#0e3a4a",
    mid: "#1d6373",
    bottom: "#4fa3a5",
    orb1: "rgba(255, 138, 101, 0.38)",
    orb2: "rgba(94, 234, 212, 0.28)",
    accent: "#7dd3fc",
    warm: "#ff9e7d",
    dot: "#ff9e7d"
  },
  tokyo: {
    top: "#1c133d",
    mid: "#432366",
    bottom: "#8b3a62",
    orb1: "rgba(244, 114, 182, 0.42)",
    orb2: "rgba(129, 140, 248, 0.34)",
    accent: "#f9a8d4",
    warm: "#fda4af",
    dot: "#f472b6"
  },
  reykjavik: {
    top: "#09252c",
    mid: "#114b4f",
    bottom: "#237873",
    orb1: "rgba(52, 211, 153, 0.38)",
    orb2: "rgba(56, 189, 248, 0.28)",
    accent: "#6ee7b7",
    warm: "#a7f3d0",
    dot: "#34d399"
  },
  zurich: {
    top: "#14274e",
    mid: "#274c77",
    bottom: "#6096ba",
    orb1: "rgba(186, 230, 253, 0.42)",
    orb2: "rgba(147, 197, 253, 0.3)",
    accent: "#bae6fd",
    warm: "#fde68a",
    dot: "#60a5fa"
  },
  mumbai: {
    top: "#2e1635",
    mid: "#6c2c4e",
    bottom: "#c96244",
    orb1: "rgba(251, 191, 36, 0.42)",
    orb2: "rgba(249, 115, 22, 0.3)",
    accent: "#fed7aa",
    warm: "#fbbf24",
    dot: "#fbbf24"
  }
};

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function getCityPalette(city, isNight = false) {
  const key = (city?.name || "").trim().toLowerCase();
  const preset = CITY_PALETTES[key];
  if (preset) {
    if (!isNight) return preset;
    return {
      ...preset,
      top: darkenHex(preset.top, 0.55),
      mid: darkenHex(preset.mid, 0.6),
      bottom: darkenHex(preset.bottom, 0.62)
    };
  }

  const seed = hashString(`${key}:${Math.round((city?.lat || 0) * 10)},${Math.round((city?.lon || 0) * 10)}`);
  const hue1 = seed % 360;
  const hue2 = (hue1 + 38 + (seed % 45)) % 360;
  const hueAccent = (hue1 + 165) % 360;
  const lScale = isNight ? 0.58 : 1;

  return {
    top: `hsl(${hue1}, 58%, ${Math.round(16 * lScale)}%)`,
    mid: `hsl(${(hue1 + 16) % 360}, 52%, ${Math.round(30 * lScale)}%)`,
    bottom: `hsl(${hue2}, 48%, ${Math.round(46 * lScale)}%)`,
    orb1: `hsla(${hueAccent}, 86%, 68%, 0.36)`,
    orb2: `hsla(${hue2}, 82%, 66%, 0.28)`,
    accent: `hsl(${hueAccent}, 92%, 78%)`,
    warm: `hsl(${(hueAccent + 35) % 360}, 92%, 76%)`,
    dot: `hsl(${hueAccent}, 88%, 68%)`
  };
}

function darkenHex(hex, factor) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = Math.round(((num >> 16) & 255) * factor);
  const g = Math.round(((num >> 8) & 255) * factor);
  const b = Math.round((num & 255) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

function clearCustomPaletteVars() {
  const s = document.body.style;
  ["--sky-top", "--sky-mid", "--sky-bottom", "--orb-1", "--orb-2", "--accent", "--accent-warm"].forEach((v) =>
    s.removeProperty(v)
  );
}

function applyCityPaletteVars(palette) {
  const s = document.body.style;
  s.setProperty("--sky-top", palette.top);
  s.setProperty("--sky-mid", palette.mid);
  s.setProperty("--sky-bottom", palette.bottom);
  s.setProperty("--orb-1", palette.orb1);
  s.setProperty("--orb-2", palette.orb2);
  s.setProperty("--accent", palette.accent);
  s.setProperty("--accent-warm", palette.warm);
}

function loadSavedCities() {
  try {
    const raw = localStorage.getItem("aether_saved_cities");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return [...DEFAULT_CITIES];
}

function persistSavedCities() {
  try {
    localStorage.setItem("aether_saved_cities", JSON.stringify(state.savedCities));
  } catch (_) {}
}

// ---------- SVG Weather Icons ----------
function getWeatherSvg(kind, isNight = false) {
  const sunOrMoon = isNight
    ? `<circle cx="32" cy="30" r="14" fill="#e0e7ff" opacity="0.92"/>
       <circle cx="38" cy="25" r="11" fill="rgba(14,25,51,0.9)"/>`
    : `<circle cx="32" cy="32" r="12" fill="url(#sunCore)"/>
       <g stroke="#fde68a" stroke-width="2.4" stroke-linecap="round">
         <line x1="32" y1="8" x2="32" y2="14"/><line x1="32" y1="50" x2="32" y2="56"/>
         <line x1="8" y1="32" x2="14" y2="32"/><line x1="50" y1="32" x2="56" y2="32"/>
         <line x1="15" y1="15" x2="19.5" y2="19.5"/><line x1="44.5" y1="44.5" x2="49" y2="49"/>
         <line x1="49" y1="15" x2="44.5" y2="19.5"/><line x1="19.5" y1="44.5" x2="15" y2="49"/>
       </g>`;

  const cloudShape = `<path d="M21 44h23a9 9 0 0 0 1.4-17.9A12 12 0 0 0 22.5 23a9.5 9.5 0 0 0-1.5 21z" fill="url(#cloudGrad)"/>`;

  if (kind === "sun") {
    return `<svg viewBox="0 0 64 64" fill="none">${sunOrMoon}</svg>`;
  }
  if (kind === "partly") {
    return `<svg viewBox="0 0 64 64" fill="none"><g transform="translate(-6,-6) scale(0.82)">${sunOrMoon}</g>${cloudShape}</svg>`;
  }
  if (kind === "cloud" || kind === "fog") {
    return `<svg viewBox="0 0 64 64" fill="none">${cloudShape}${
      kind === "fog"
        ? `<line x1="16" y1="50" x2="48" y2="50" stroke="#e2e8f0" stroke-width="2.4" stroke-linecap="round" opacity="0.7"/>
           <line x1="20" y1="55" x2="44" y2="55" stroke="#e2e8f0" stroke-width="2.4" stroke-linecap="round" opacity="0.5"/>`
        : ""
    }</svg>`;
  }
  if (kind === "rain") {
    return `<svg viewBox="0 0 64 64" fill="none"><g transform="translate(0,-4)">${cloudShape}</g>
      <g stroke="#7dd3fc" stroke-width="2.6" stroke-linecap="round">
        <line x1="24" y1="45" x2="21" y2="53"/><line x1="33" y1="45" x2="30" y2="55"/><line x1="42" y1="45" x2="39" y2="53"/>
      </g></svg>`;
  }
  if (kind === "snow") {
    return `<svg viewBox="0 0 64 64" fill="none"><g transform="translate(0,-4)">${cloudShape}</g>
      <g fill="#e0f2fe">
        <circle cx="24" cy="49" r="2.2"/><circle cx="33" cy="52" r="2.2"/><circle cx="42" cy="49" r="2.2"/>
      </g></svg>`;
  }
  return `<svg viewBox="0 0 64 64" fill="none"><g transform="translate(0,-5)">${cloudShape}</g>
    <path d="M34 40l-6 10h6l-3 9 10-12h-6l4-7z" fill="#fde047"/></svg>`;
}

// ---------- Formatting Helpers ----------
function toUnitTemp(celsius) {
  if (celsius == null || Number.isNaN(celsius)) return "--";
  const val = state.unit === "F" ? (celsius * 9) / 5 + 32 : celsius;
  return Math.round(val);
}

function formatTemp(celsius) {
  const t = toUnitTemp(celsius);
  return t === "--" ? "--°" : `${t}°`;
}

function windCardinal(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function formatTimeShort(isoString) {
  if (!isoString) return "--:--";
  const timePart = isoString.split("T")[1];
  return timePart ? timePart.slice(0, 5) : isoString;
}

function formatHourLabel(isoString, idx) {
  if (idx === 0) return "Now";
  const hour = parseInt(isoString.split("T")[1].slice(0, 2), 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${ampm}`;
}

function formatDayName(dateStr, idx) {
  if (idx === 0) return "Today";
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function getWmoInfo(code) {
  return WMO_MAP[code] || { label: "Variable Sky", icon: "partly", mood: "clear-day" };
}

// ---------- API Fetching ----------
async function fetchCityWeather(city) {
  state.currentCity = city;
  renderSavedCities();
  updatePinButton();
  setBanner("");

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
    `&hourly=temperature_2m,precipitation_probability,weather_code,visibility,dew_point_2m,uv_index,is_day,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max` +
    `&timezone=auto&past_days=2&forecast_days=7`;

  const aqiUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}` +
    `&current=us_aqi,pm10,pm2_5,ozone,grass_pollen,birch_pollen&timezone=auto`;

  try {
    const [wRes, aRes] = await Promise.all([fetch(weatherUrl), fetch(aqiUrl)]);
    if (!wRes.ok) throw new Error(`Weather API error (${wRes.status})`);
    const weatherJson = await wRes.json();
    const aqiJson = aRes.ok ? await aRes.json() : null;

    state.weatherData = weatherJson;
    state.aqiData = aqiJson;
    renderDashboard();
    loadAreaWiseWeather(city);
    trackAndRenderAccuracy(city, weatherJson, false);
  } catch (err) {
    console.warn("Live fetch failed, falling back to atmospheric sample:", err);
    setBanner("Live telemetry unreachable — displaying offline atmospheric sample for " + city.name);
    state.weatherData = buildFallbackWeather(city);
    state.aqiData = { current: { us_aqi: 28, pm2_5: 6.4, pm10: 12.8, ozone: 42 } };
    renderDashboard();
    loadAreaWiseWeather(city);
    trackAndRenderAccuracy(city, state.weatherData, true);
  }
}

function buildFallbackWeather(city) {
  const now = new Date();
  const hours = [];
  const temps = [];
  const pops = [];
  const codes = [];
  const isDays = [];
  const base = 17;

  for (let i = 0; i < 48; i++) {
    const dt = new Date(now.getTime() + i * 3600 * 1000);
    const iso = dt.toISOString().slice(0, 13) + ":00";
    const h = dt.getHours();
    hours.push(iso);
    temps.push(Number((base + Math.sin(((h - 8) / 24) * Math.PI * 2) * 5).toFixed(1)));
    pops.push(i % 7 === 0 ? 25 : 10);
    codes.push(i % 6 === 0 ? 2 : 1);
    isDays.push(h >= 6 && h < 19 ? 1 : 0);
  }

  const dailyDates = [];
  const dMax = [];
  const dMin = [];
  const dCodes = [1, 2, 61, 2, 0, 1, 3];
  const dPops = [15, 20, 65, 25, 5, 10, 35];
  const sunrises = [];
  const sunsets = [];

  for (let d = -2; d < 7; d++) {
    const dt = new Date(now.getTime() + d * 86400 * 1000);
    const ds = dt.toISOString().slice(0, 10);
    dailyDates.push(ds);
    dMax.push(21 + (Math.abs(d) % 3));
    dMin.push(11 + (Math.abs(d) % 2));
    sunrises.push(`${ds}T06:34`);
    sunsets.push(`${ds}T17:48`);
  }

  return {
    timezone: "UTC",
    current: {
      time: hours[0],
      temperature_2m: 18.4,
      relative_humidity_2m: 62,
      apparent_temperature: 17.8,
      is_day: 1,
      precipitation: 0,
      weather_code: 1,
      cloud_cover: 24,
      surface_pressure: 1016.4,
      wind_speed_10m: 14.2,
      wind_direction_10m: 285,
      wind_gusts_10m: 23.0
    },
    hourly: {
      time: hours,
      temperature_2m: temps,
      precipitation_probability: pops,
      weather_code: codes,
      visibility: Array(48).fill(18500),
      dew_point_2m: Array(48).fill(10.8),
      uv_index: Array(48).fill(4.2),
      is_day: isDays,
      wind_speed_10m: Array(48).fill(14.0)
    },
    daily: {
      time: dailyDates,
      weather_code: [1, 2, ...dCodes],
      temperature_2m_max: dMax,
      temperature_2m_min: dMin,
      sunrise: sunrises,
      sunset: sunsets,
      uv_index_max: [5.0, 4.8, 5.4, 5.1, 3.2, 4.9, 6.0, 5.8, 4.0],
      precipitation_probability_max: [10, 20, ...dPops]
    }
  };
}

function sliceDailyFromToday(daily, curTime) {
  const todayStr = (curTime || "").slice(0, 10);
  const found = daily.time.findIndex((d) => d >= todayStr);
  const start = found >= 0 ? found : 0;
  return {
    time: daily.time.slice(start),
    weather_code: daily.weather_code.slice(start),
    temperature_2m_max: daily.temperature_2m_max.slice(start),
    temperature_2m_min: daily.temperature_2m_min.slice(start),
    sunrise: daily.sunrise.slice(start),
    sunset: daily.sunset.slice(start),
    uv_index_max: daily.uv_index_max.slice(start),
    precipitation_probability_max: daily.precipitation_probability_max.slice(start)
  };
}

// ---------- Rendering ----------
function renderDashboard() {
  const data = state.weatherData;
  const city = state.currentCity;
  if (!data || !city) return;

  const cur = data.current;
  const daily = sliceDailyFromToday(data.daily, cur.time);
  const hourly = data.hourly;
  const wmo = getWmoInfo(cur.weather_code);
  const isNight = cur.is_day === 0;

  // Theme resolution & weather-reactive canvas
  applyAutoTheme(wmo, cur, daily);
  particlesEngine.setWeatherState({
    mode: state.activeMood,
    isStorm: [82, 95, 96, 99].includes(cur.weather_code),
    isFog: [45, 48].includes(cur.weather_code),
    isCloudy: cur.cloud_cover >= 65
  });

  // Header & Hero
  document.getElementById("city-name").textContent = city.name;
  document.getElementById("city-region").textContent = city.region || `${city.lat.toFixed(2)}°, ${city.lon.toFixed(2)}°`;
  updateHeroClock();
  document.getElementById("hero-emblem").innerHTML = getWeatherSvg(wmo.icon, isNight);

  document.getElementById("current-temp").textContent = formatTemp(cur.temperature_2m);
  document.getElementById("condition-text").textContent = wmo.label;
  document.getElementById("feels-like").textContent = `Feels like ${formatTemp(cur.apparent_temperature)}`;

  document.getElementById("today-high").textContent = formatTemp(daily.temperature_2m_max[0]);
  document.getElementById("today-low").textContent = formatTemp(daily.temperature_2m_min[0]);
  document.getElementById("today-precip").textContent = `${daily.precipitation_probability_max[0] ?? 0}%`;

  document.getElementById("atmosphere-summary").textContent = buildSummary(wmo.label, cur, daily);

  // Find current hour index inside hourly array
  const currentIdx = Math.max(
    0,
    hourly.time.findIndex((t) => t >= cur.time.slice(0, 13))
  );
  const slice24 = {
    time: hourly.time.slice(currentIdx, currentIdx + 24),
    temp: hourly.temperature_2m.slice(currentIdx, currentIdx + 24),
    pop: hourly.precipitation_probability.slice(currentIdx, currentIdx + 24),
    code: hourly.weather_code.slice(currentIdx, currentIdx + 24),
    isDay: hourly.is_day.slice(currentIdx, currentIdx + 24),
    uv: (hourly.uv_index || []).slice(currentIdx, currentIdx + 24),
    wind: (hourly.wind_speed_10m || []).slice(currentIdx, currentIdx + 24)
  };

  renderHourly(slice24);
  renderWeekly(daily);
  renderTelemetry(cur, hourly, daily, currentIdx);
  renderAqi();
  renderInsights(cur, slice24, daily, hourly.uv_index?.[currentIdx] ?? daily.uv_index_max?.[0] ?? 0);

  document.getElementById("last-updated").textContent = `Updated ${new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
  renderAreaGrid();
  if (state.accuracyItems) renderAccuracyGrid(state.accuracyItems, state.accuracyScore);
}

function updateHeroClock() {
  const tz = state.weatherData?.timezone;
  const now = new Date();
  const timeEl = document.getElementById("live-time");
  const dateEl = document.getElementById("live-date");
  const tzEl = document.getElementById("live-tz");
  if (!timeEl || !dateEl || !tzEl) return;

  if (!tz) {
    timeEl.textContent = now.toLocaleTimeString();
    dateEl.textContent = now.toLocaleDateString();
    tzEl.textContent = "Local";
    return;
  }

  try {
    timeEl.textContent = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }).format(now);
    dateEl.textContent = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(now);
    tzEl.textContent = tz.replace(/_/g, " ");
  } catch (_) {
    timeEl.textContent = now.toLocaleTimeString();
    dateEl.textContent = now.toLocaleDateString();
    tzEl.textContent = tz;
  }
}

function formatAreaClock(tz) {
  if (!tz) return "--:--:--";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }).format(new Date());
  } catch (_) {
    return "--:--";
  }
}

function startLiveClocks() {
  setInterval(() => {
    updateHeroClock();
    document.querySelectorAll(".area-time[data-tz]").forEach((el) => {
      el.textContent = formatAreaClock(el.dataset.tz);
    });
  }, 1000);
}

function toUnitSpeed(kmh) {
  if (kmh == null || Number.isNaN(kmh)) return 0;
  return state.unit === "F" ? Math.round(kmh * 0.621371) : Math.round(kmh);
}

function speedUnitLabel() {
  return state.unit === "F" ? "mph" : "km/h";
}

function buildSummary(label, cur, daily) {
  const high = formatTemp(daily.temperature_2m_max[0]);
  const low = formatTemp(daily.temperature_2m_min[0]);
  const wind = toUnitSpeed(cur.wind_speed_10m);
  const dir = windCardinal(cur.wind_direction_10m);
  return `${label} right now with a ${dir} breeze at ${wind} ${speedUnitLabel()}. Expect temperatures between ${low} and ${high} today.`;
}

function applyAutoTheme(wmo, cur, daily) {
  if (state.moodOverride !== "auto") {
    clearCustomPaletteVars();
    setTheme(state.moodOverride);
    return;
  }

  const isNight = cur.is_day === 0;
  const palette = getCityPalette(state.currentCity, isNight);
  applyCityPaletteVars(palette);

  let resolved = wmo.mood;
  if (isNight) {
    resolved = wmo.mood === "rain" || wmo.mood === "snow" ? wmo.mood : "night";
  } else if (daily?.sunset?.[0] && cur.time) {
    const curMin = toMinutes(cur.time.split("T")[1]);
    const sunsetMin = toMinutes(daily.sunset[0].split("T")[1]);
    const sunriseMin = toMinutes(daily.sunrise[0].split("T")[1]);
    if (Math.abs(curMin - sunsetMin) <= 55 || Math.abs(curMin - sunriseMin) <= 45) {
      if (resolved === "clear-day") resolved = "golden-dusk";
    }
  }
  setTheme(resolved);
}

function toMinutes(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function setTheme(theme) {
  state.activeMood = theme;
  document.body.setAttribute("data-theme", theme);
  particlesEngine.setMode(theme);
}

// ---------- Hourly Strip & SVG Bezier Curve ----------
function renderHourly(slice) {
  const strip = document.getElementById("hourly-strip");
  strip.innerHTML = "";

  slice.time.forEach((t, idx) => {
    const wmo = getWmoInfo(slice.code[idx]);
    const pill = document.createElement("button");
    pill.className = "hour-pill" + (idx === 0 ? " active" : "");
    pill.innerHTML = `
      <span class="hour-time mono">${formatHourLabel(t, idx)}</span>
      <span class="hour-icon">${getWeatherSvg(wmo.icon, slice.isDay[idx] === 0)}</span>
      <span class="hour-temp mono">${formatTemp(slice.temp[idx])}</span>
      <span class="hour-pop mono">${slice.pop[idx] ?? 0}%</span>
    `;
    pill.addEventListener("mouseenter", () => highlightHour(idx, slice));
    pill.addEventListener("click", () => highlightHour(idx, slice));
    strip.appendChild(pill);
  });

  drawHourlyCurve(slice);
  highlightHour(0, slice);
}

function drawHourlyCurve(slice) {
  const svg = document.getElementById("hourly-curve-svg");
  const temps = slice.temp.map((c) => (state.unit === "F" ? (c * 9) / 5 + 32 : c));
  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);
  const span = Math.max(2, maxT - minT);

  const W = 720;
  const H = 144;
  const padX = 18;
  const padTop = 26;
  const padBot = 26;

  const pts = temps.map((t, i) => {
    const x = padX + (i / Math.max(1, temps.length - 1)) * (W - padX * 2);
    const y = padTop + (1 - (t - minT) / span) * (H - padTop - padBot);
    return { x, y, t: Math.round(t), pop: slice.pop[i] ?? 0 };
  });

  // Smooth Catmull-Rom / cubic path
  let pathD = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cx = (p0.x + p1.x) / 2;
    pathD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  const precipBars = pts
    .map((p) => {
      const bh = Math.max(2, (p.pop / 100) * 28);
      return `<rect x="${p.x - 3}" y="${H - bh}" width="6" height="${bh}" rx="3" fill="rgba(125,211,252,0.32)" />`;
    })
    .join("");

  const labels = pts
    .filter((_, i) => i % 4 === 0 || i === pts.length - 1)
    .map(
      (p) =>
        `<text x="${p.x}" y="${p.y - 10}" text-anchor="middle" fill="rgba(248,250,252,0.8)" font-size="11" font-family="JetBrains Mono, monospace">${p.t}°</text>`
    )
    .join("");

  svg.innerHTML = `
    <defs>
      <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(252, 211, 77, 0.34)"/>
        <stop offset="100%" stop-color="rgba(252, 211, 77, 0.0)"/>
      </linearGradient>
    </defs>
    ${precipBars}
    <path d="${areaD}" fill="url(#curveFill)" />
    <path d="${pathD}" fill="none" stroke="#fde68a" stroke-width="2.6" stroke-linecap="round" />
    ${labels}
    <line id="curve-guide-line" x1="${pts[0].x}" y1="${pts[0].y}" x2="${pts[0].x}" y2="${H}" stroke="rgba(255,255,255,0.22)" stroke-dasharray="3 3" />
    <circle id="curve-focus-dot" cx="${pts[0].x}" cy="${pts[0].y}" r="5" fill="#ffffff" stroke="#fde68a" stroke-width="3" />
  `;

  svg._pts = pts;
}

function highlightHour(idx, slice) {
  const pills = document.querySelectorAll(".hour-pill");
  pills.forEach((p, i) => p.classList.toggle("active", i === idx));

  const svg = document.getElementById("hourly-curve-svg");
  const dot = document.getElementById("curve-focus-dot");
  const guide = document.getElementById("curve-guide-line");
  if (svg._pts && svg._pts[idx] && dot) {
    dot.setAttribute("cx", svg._pts[idx].x);
    dot.setAttribute("cy", svg._pts[idx].y);
    if (guide) {
      guide.setAttribute("x1", svg._pts[idx].x);
      guide.setAttribute("y1", svg._pts[idx].y);
      guide.setAttribute("x2", svg._pts[idx].x);
    }
  }

  const wmo = getWmoInfo(slice.code[idx]);
  document.getElementById("hourly-focus-readout").textContent = `${formatHourLabel(
    slice.time[idx],
    idx
  )} · ${formatTemp(slice.temp[idx])} · ${wmo.label} · ${slice.pop[idx] ?? 0}% rain`;
}

// ---------- 7-Day Outlook ----------
function renderWeekly(daily) {
  const list = document.getElementById("weekly-list");
  list.innerHTML = "";

  const globalMin = Math.min(...daily.temperature_2m_min);
  const globalMax = Math.max(...daily.temperature_2m_max);
  const totalSpan = Math.max(1, globalMax - globalMin);

  daily.time.forEach((dayStr, i) => {
    const wmo = getWmoInfo(daily.weather_code[i]);
    const low = daily.temperature_2m_min[i];
    const high = daily.temperature_2m_max[i];
    const leftPct = ((low - globalMin) / totalSpan) * 100;
    const widthPct = Math.max(8, ((high - low) / totalSpan) * 100);

    const row = document.createElement("div");
    row.className = "day-row";
    row.innerHTML = `
      <span class="day-name">${formatDayName(dayStr, i)}</span>
      <span class="day-icon">${getWeatherSvg(wmo.icon, false)}</span>
      <span class="day-pop mono">${daily.precipitation_probability_max[i] ?? 0}%</span>
      <div class="day-range-wrap">
        <span class="day-low mono">${formatTemp(low)}</span>
        <div class="day-bar-track">
          <div class="day-bar-fill" style="left: ${leftPct}%; width: ${widthPct}%"></div>
        </div>
        <span class="day-high mono">${formatTemp(high)}</span>
      </div>
    `;
    list.appendChild(row);
  });
}

// ---------- Telemetry Cards ----------
function renderTelemetry(cur, hourly, daily, idx) {
  // Wind
  document.getElementById("wind-speed").textContent = toUnitSpeed(cur.wind_speed_10m);
  document.getElementById("wind-unit").textContent = speedUnitLabel();
  document.getElementById("wind-dir-label").textContent = `${windCardinal(cur.wind_direction_10m)} · ${Math.round(
    cur.wind_direction_10m
  )}°`;
  document.getElementById("wind-gusts").textContent = `Gusts up to ${toUnitSpeed(cur.wind_gusts_10m)} ${speedUnitLabel()}`;
  document.getElementById("compass-needle").style.transform = `rotate(${cur.wind_direction_10m}deg)`;

  // Humidity & Dew Point
  document.getElementById("humidity-value").textContent = `${Math.round(cur.relative_humidity_2m)}%`;
  const dew = hourly.dew_point_2m?.[idx];
  document.getElementById("dew-point").textContent = `Dew point at ${formatTemp(dew)} right now`;

  // Pressure, Clouds, Visibility
  document.getElementById("pressure-value").textContent = Math.round(cur.surface_pressure);
  document.getElementById("cloud-cover").textContent = `${cur.cloud_cover ?? 0}% clouds`;
  const rawVis = hourly.visibility?.[idx];
  const visStr =
    rawVis == null
      ? "—"
      : state.unit === "F"
      ? `${((rawVis / 1000) * 0.621371).toFixed(1)} mi`
      : `${(rawVis / 1000).toFixed(1)} km`;
  document.getElementById("visibility-value").textContent = `Visibility ${visStr}`;

  // UV Index
  const uv = hourly.uv_index?.[idx] ?? daily.uv_index_max?.[0] ?? 0;
  document.getElementById("uv-value").textContent = uv.toFixed(1);
  const uvPct = Math.min(100, (uv / 11) * 100);
  document.getElementById("uv-marker").style.left = `${uvPct}%`;
  const uvBadge = document.getElementById("uv-badge");
  const uvAdvice = document.getElementById("uv-advice");
  if (uv < 3) {
    uvBadge.textContent = "Low";
    uvBadge.className = "badge good";
    uvAdvice.textContent = "Minimal protection needed";
  } else if (uv < 6) {
    uvBadge.textContent = "Moderate";
    uvBadge.className = "badge moderate";
    uvAdvice.textContent = "Sunglasses & SPF 30+ advised";
  } else if (uv < 8) {
    uvBadge.textContent = "High";
    uvBadge.className = "badge high";
    uvAdvice.textContent = "Seek midday shade & wear SPF";
  } else {
    uvBadge.textContent = "Very High";
    uvBadge.className = "badge severe";
    uvAdvice.textContent = "Avoid direct midday exposure";
  }

  // Solar Cycle
  const sr = daily.sunrise?.[0];
  const ss = daily.sunset?.[0];
  document.getElementById("sunrise-time").textContent = formatTimeShort(sr);
  document.getElementById("sunset-time").textContent = formatTimeShort(ss);

  if (sr && ss) {
    const srMin = toMinutes(sr.split("T")[1]);
    const ssMin = toMinutes(ss.split("T")[1]);
    const durMin = Math.max(0, ssMin - srMin);
    document.getElementById("daylight-duration").textContent = `${Math.floor(durMin / 60)}h ${durMin % 60}m`;

    const curMin = toMinutes(cur.time.split("T")[1]);
    const progress = Math.max(0, Math.min(1, (curMin - srMin) / Math.max(1, ssMin - srMin)));
    updateSolarArc(progress);
  }

  // Moon Phase
  const moon = getMoonPhaseInfo(new Date());
  const moonEl = document.getElementById("moon-phase-label");
  if (moonEl) moonEl.textContent = `${moon.glyph} ${moon.name}`;
}

function getMoonPhaseInfo(date) {
  const synodicMonth = 29.53058867;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  const daysSince = (date.getTime() - knownNewMoon) / 86400000;
  const phase = ((daysSince % synodicMonth) + synodicMonth) % synodicMonth;
  const ratio = phase / synodicMonth;
  const phases = [
    { max: 0.0625, name: "New Moon", glyph: "🌑" },
    { max: 0.1875, name: "Waxing Crescent", glyph: "🌒" },
    { max: 0.3125, name: "First Quarter", glyph: "🌓" },
    { max: 0.4375, name: "Waxing Gibbous", glyph: "🌔" },
    { max: 0.5625, name: "Full Moon", glyph: "🌕" },
    { max: 0.6875, name: "Waning Gibbous", glyph: "🌖" },
    { max: 0.8125, name: "Last Quarter", glyph: "🌗" },
    { max: 0.9375, name: "Waning Crescent", glyph: "🌘" },
    { max: 1.01, name: "New Moon", glyph: "🌑" }
  ];
  return phases.find((p) => ratio <= p.max) || phases[0];
}

// ---------- Practical "So What?" Engine ----------
function renderInsights(cur, slice24, daily, uvNow) {
  // 1. Best Time Window
  const windowInfo = computeBestTimeWindow(slice24);
  document.getElementById("best-window-text").textContent = windowInfo;

  // 2. Activity Recommender
  const activities = scoreActivities(cur, slice24, daily, uvNow);
  const grid = document.getElementById("activities-grid");
  grid.innerHTML = "";
  activities.forEach((act) => {
    const color = act.score >= 75 ? "#4ade80" : act.score >= 50 ? "#facc15" : "#fb923c";
    const tile = document.createElement("div");
    tile.className = "activity-tile";
    tile.innerHTML = `
      <div class="activity-top">
        <span class="activity-name">${act.label}</span>
        <span class="activity-score mono">${act.score}/100</span>
      </div>
      <div class="activity-bar">
        <div class="activity-bar-fill" style="width: ${act.score}%; background: ${color}"></div>
      </div>
      <p class="activity-reason">${act.reason}</p>
    `;
    grid.appendChild(tile);
  });

  // 3. What to Wear & Umbrella Verdict
  const maxPop = Math.max(...(slice24.pop.slice(0, 12) || [0]), daily.precipitation_probability_max[0] ?? 0);
  const umbrellaPill = document.getElementById("umbrella-pill");
  if (maxPop >= 50) {
    umbrellaPill.textContent = `Carry Umbrella (${maxPop}%)`;
    umbrellaPill.className = "badge high";
  } else if (maxPop >= 25) {
    umbrellaPill.textContent = `Compact Umbrella (${maxPop}%)`;
    umbrellaPill.className = "badge moderate";
  } else {
    umbrellaPill.textContent = `No Umbrella Needed (${maxPop}%)`;
    umbrellaPill.className = "badge good";
  }
  document.getElementById("wear-advice").textContent = buildWearAdvice(cur, maxPop, uvNow);

  // 4. Health & Safety Alerts
  renderHealthAlerts(cur, uvNow, state.aqiData?.current);
}

function computeBestTimeWindow(slice24) {
  const len = Math.min(18, slice24.time.length);
  if (len === 0) return "Hourly forecast unavailable.";

  // Score each upcoming hour for outdoor comfort
  const scores = [];
  for (let i = 0; i < len; i++) {
    const t = slice24.temp[i] ?? 20;
    const pop = slice24.pop[i] ?? 0;
    const wind = slice24.wind?.[i] ?? 10;
    const uv = slice24.uv?.[i] ?? 2;
    let s = 100 - pop * 1.1 - Math.abs(t - 21) * 2.1 - Math.max(0, wind - 18) * 1.5 - Math.max(0, uv - 6) * 5;
    if (slice24.isDay[i] === 0) s -= 6;
    scores.push(Math.max(0, Math.round(s)));
  }

  // Find best contiguous 3-hour window
  let bestStart = 0;
  let bestAvg = -1;
  for (let i = 0; i <= Math.max(0, len - 3); i++) {
    const avg = (scores[i] + (scores[i + 1] ?? scores[i]) + (scores[i + 2] ?? scores[i])) / 3;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestStart = i;
    }
  }

  const endIdx = Math.min(len - 1, bestStart + 3);
  const startLabel = formatHourClock(slice24.time[bestStart], bestStart === 0);
  const endLabel = formatHourClock(slice24.time[endIdx], false);
  const avgTemp = formatTemp(
    (slice24.temp[bestStart] + (slice24.temp[endIdx] ?? slice24.temp[bestStart])) / 2
  );
  const winPop = Math.max(slice24.pop[bestStart] ?? 0, slice24.pop[bestStart + 1] ?? 0);
  const rainyNow = (slice24.pop[0] ?? 0) >= 45;

  if (rainyNow && bestStart > 0 && winPop < 35) {
    return `Rain eases by ${startLabel} — best outdoor window is ${startLabel} to ${endLabel} (${avgTemp}, ${winPop}% rain chance).`;
  }
  if (bestStart === 0) {
    return `Conditions are at their best right now through ${endLabel} (${avgTemp}, ${winPop}% rain chance) — great time to head outside.`;
  }
  return `Peak outdoor window is ${startLabel} to ${endLabel} with comfortable ${avgTemp} temps and ${winPop}% rain chance.`;
}

function formatHourClock(iso, isNow) {
  if (isNow) return "now";
  const h = parseInt(iso.split("T")[1].slice(0, 2), 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${ampm}`;
}

function scoreActivities(cur, slice24, daily, uvNow) {
  const temp = cur.temperature_2m;
  const wind = cur.wind_speed_10m;
  const hum = cur.relative_humidity_2m;
  const popNow = slice24.pop[0] ?? 0;
  const pop6h = Math.max(...(slice24.pop.slice(0, 6) || [0]));

  // Running
  let run = Math.round(100 - Math.abs(temp - 17) * 2.8 - popNow * 0.9 - Math.max(0, wind - 18) * 1.6 - Math.max(0, uvNow - 6) * 6);
  run = Math.max(10, Math.min(99, run));
  const runReason = `${formatTemp(temp)}, ${toUnitSpeed(wind)} ${speedUnitLabel()} wind, ${popNow}% rain.`;

  // Cycling
  let cycle = Math.round(100 - Math.abs(temp - 20) * 2.2 - popNow * 1.1 - Math.max(0, wind - 14) * 2.3);
  cycle = Math.max(10, Math.min(99, cycle));
  const cycleReason = wind > 24 ? `Strong ${toUnitSpeed(wind)} ${speedUnitLabel()} gusts ahead.` : `${popNow}% rain & gentle ${toUnitSpeed(wind)} ${speedUnitLabel()} breeze.`;

  // Outdoor Photography
  const clouds = cur.cloud_cover ?? 30;
  let photo = Math.round(92 - Math.abs(clouds - 40) * 0.45 - popNow * 0.75);
  if (state.activeMood === "golden-dusk") photo = Math.min(99, photo + 10);
  photo = Math.max(15, Math.min(99, photo));
  const photoReason =
    state.activeMood === "golden-dusk"
      ? "Golden hour light with balanced sky contrast."
      : `${clouds}% cloud texture · good visibility.`;

  // Laundry Drying
  let laundry = Math.round(100 - pop6h * 1.25 - Math.max(0, hum - 50) * 0.85 + Math.min(12, wind * 0.4) - Math.max(0, 18 - temp) * 1.8);
  laundry = Math.max(5, Math.min(99, laundry));
  const laundryReason =
    pop6h >= 40
      ? `${pop6h}% rain risk in next 6h — keep indoors.`
      : `${Math.round(hum)}% humidity & ${toUnitSpeed(wind)} ${speedUnitLabel()} airflow.`;

  return [
    { label: "Running", score: run, reason: runReason },
    { label: "Cycling", score: cycle, reason: cycleReason },
    { label: "Photography", score: photo, reason: photoReason },
    { label: "Laundry Drying", score: laundry, reason: laundryReason }
  ];
}

function buildWearAdvice(cur, maxPop, uvNow) {
  const feels = cur.apparent_temperature;
  const wind = cur.wind_speed_10m;
  const parts = [];
  if (feels >= 29) parts.push("Light, breathable cotton or linen");
  else if (feels >= 21) parts.push("T-shirt or light breathable layers");
  else if (feels >= 13) parts.push("Long sleeves with a light jacket");
  else if (feels >= 5) parts.push("Warm sweater and windproof coat");
  else parts.push("Heavy insulated coat, gloves & warm layers");

  if (wind >= 25) parts.push("windbreaker recommended");
  if (uvNow >= 5 && cur.is_day === 1) parts.push("sunglasses & SPF 30+");
  if (maxPop >= 45) parts.push("waterproof outer layer & umbrella");
  return parts.join(" · ") + ".";
}

function renderHealthAlerts(cur, uvNow, aqiCur) {
  const wrap = document.getElementById("health-alerts");
  wrap.innerHTML = "";
  const pills = [];

  if (cur.apparent_temperature >= 34) pills.push({ text: "Heat Stress: Hydrate often", cls: "warn" });
  else if (cur.apparent_temperature <= 4) pills.push({ text: "Cold Advisory: Bundle up", cls: "warn" });
  else pills.push({ text: "Thermal Comfort: Mild", cls: "good" });

  if (uvNow >= 6) pills.push({ text: `High UV (${uvNow.toFixed(1)}): Shade + SPF`, cls: "warn" });
  else pills.push({ text: `UV Safe (${uvNow.toFixed(1)})`, cls: "good" });

  const aqi = aqiCur?.us_aqi;
  if (aqi != null) {
    pills.push({
      text: aqi > 100 ? `AQI ${Math.round(aqi)}: Limit heavy exertion` : `Air Clean (AQI ${Math.round(aqi)})`,
      cls: aqi > 100 ? "warn" : "good"
    });
  }

  const pollen = Math.max(aqiCur?.grass_pollen ?? 0, aqiCur?.birch_pollen ?? 0);
  if (aqiCur?.grass_pollen != null || aqiCur?.birch_pollen != null) {
    pills.push({
      text: pollen > 30 ? `Pollen Elevated (${Math.round(pollen)})` : "Pollen Low",
      cls: pollen > 30 ? "warn" : "good"
    });
  }

  pills.forEach((p) => {
    const span = document.createElement("span");
    span.className = `health-pill ${p.cls}`;
    span.textContent = p.text;
    wrap.appendChild(span);
  });
}

// ---------- Smart Forecast Accuracy Tracker (IndexedDB + Open-Meteo Previous Runs) ----------
const accuracyDb = (() => {
  const DB_NAME = "aether_forecast_db";
  const STORE = "snapshots";

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error("No IndexedDB"));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function put(record) {
    try {
      const db = await openDb();
      await new Promise((res, rej) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(record);
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      });
    } catch (_) {
      try {
        const all = JSON.parse(localStorage.getItem(DB_NAME) || "{}");
        all[record.id] = record;
        localStorage.setItem(DB_NAME, JSON.stringify(all));
      } catch (__) {}
    }
  }

  async function getByCity(cityKey) {
    try {
      const db = await openDb();
      return await new Promise((res, rej) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => res((req.result || []).filter((r) => r.cityKey === cityKey));
        req.onerror = () => rej(req.error);
      });
    } catch (_) {
      try {
        const all = JSON.parse(localStorage.getItem(DB_NAME) || "{}");
        return Object.values(all).filter((r) => r.cityKey === cityKey);
      } catch (__) {
        return [];
      }
    }
  }

  return { put, getByCity };
})();

async function trackAndRenderAccuracy(city, weatherData, isOffline) {
  const cityKey = `${city.lat.toFixed(2)},${city.lon.toFixed(2)}`;
  const daily = weatherData.daily;
  const todayStr = (weatherData.current?.time || "").slice(0, 10);
  const todayIdx = Math.max(0, daily.time.findIndex((d) => d >= todayStr));

  // Save today's and tomorrow's forecast into IndexedDB
  for (let offset = 0; offset <= 1; offset++) {
    const idx = todayIdx + offset;
    if (daily.time[idx]) {
      await accuracyDb.put({
        id: `${cityKey}|${daily.time[idx]}`,
        cityKey,
        date: daily.time[idx],
        predHigh: daily.temperature_2m_max[idx],
        predLow: daily.temperature_2m_min[idx],
        predCode: daily.weather_code[idx],
        savedAt: new Date().toISOString()
      });
    }
  }

  // Pull previous-day model runs when online so day-1 users get real accuracy comparisons immediately
  let prevRuns = null;
  if (!isOffline) {
    try {
      const prevUrl =
        `https://previous-runs-api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
        `&daily=temperature_2m_max_previous_day1,temperature_2m_min_previous_day1&past_days=3&forecast_days=1&timezone=auto`;
      const res = await fetch(prevUrl);
      if (res.ok) prevRuns = await res.json();
    } catch (_) {}
  }

  const stored = await accuracyDb.getByCity(cityKey);
  const storedMap = Object.fromEntries(stored.map((r) => [r.date, r]));
  const items = [];
  const scores = [];

  for (let i = 0; i < todayIdx; i++) {
    const dStr = daily.time[i];
    const obsHigh = daily.temperature_2m_max[i];
    const obsLow = daily.temperature_2m_min[i];

    let predHigh = storedMap[dStr]?.predHigh;
    let predLow = storedMap[dStr]?.predLow;
    let sourceLabel = "Saved DB";

    if (predHigh == null && prevRuns?.daily?.time) {
      const pIdx = prevRuns.daily.time.indexOf(dStr);
      if (pIdx >= 0 && prevRuns.daily.temperature_2m_max_previous_day1?.[pIdx] != null) {
        predHigh = prevRuns.daily.temperature_2m_max_previous_day1[pIdx];
        predLow = prevRuns.daily.temperature_2m_min_previous_day1[pIdx];
        sourceLabel = "Prev-Day Run";
      }
    }

    if (predHigh != null && predLow != null) {
      const err = Math.abs(predHigh - obsHigh) + Math.abs(predLow - obsLow);
      const pct = Math.max(50, Math.round(100 - err * 4.5));
      scores.push(pct);
      items.push({
        date: dStr,
        label: i === todayIdx - 1 ? "Yesterday" : formatDayName(dStr, 1) + ` (${dStr.slice(5)})`,
        source: sourceLabel,
        predHigh,
        predLow,
        obsHigh,
        obsLow,
        score: pct
      });
    }
  }

  // Always include today's locked snapshot card
  items.push({
    date: daily.time[todayIdx],
    label: "Today (Locked in DB)",
    source: "Tracking Live",
    predHigh: daily.temperature_2m_max[todayIdx],
    predLow: daily.temperature_2m_min[todayIdx],
    obsHigh: null,
    obsLow: null,
    score: null
  });

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  state.accuracyItems = items;
  state.accuracyScore = avgScore;
  renderAccuracyGrid(items, avgScore);
}

function renderAccuracyGrid(items, avgScore) {
  const scoreEl = document.getElementById("accuracy-score");
  const grid = document.getElementById("accuracy-grid");
  if (!scoreEl || !grid) return;

  scoreEl.textContent = avgScore != null ? `${avgScore}%` : "Tracking";
  grid.innerHTML = "";

  items.slice(-3).forEach((item) => {
    const tile = document.createElement("div");
    tile.className = "accuracy-tile";
    const badgeCls = item.score == null ? "badge" : item.score >= 88 ? "badge good" : "badge moderate";
    const badgeText = item.score == null ? "Pending" : `${item.score}% Match`;

    tile.innerHTML = `
      <div class="accuracy-head">
        <span class="accuracy-day">${item.label}</span>
        <span class="${badgeCls}">${badgeText}</span>
      </div>
      <div class="accuracy-rows mono">
        <span>Predicted: <strong>${formatTemp(item.predHigh)} / ${formatTemp(item.predLow)}</strong></span>
        <span>${
          item.obsHigh != null
            ? `Actual: <strong>${formatTemp(item.obsHigh)} / ${formatTemp(item.obsLow)}</strong>`
            : `Saved for tomorrow`
        }</span>
      </div>
      <p class="metric-foot">${item.date} · Source: ${item.source}</p>
    `;
    grid.appendChild(tile);
  });
}

function updateSolarArc(progress) {
  // Elliptical arc from (22, 78) to (198, 78) with center (110, 78), rx=88, ry=68
  const angle = Math.PI * (1 - progress);
  const x = 110 + 88 * Math.cos(angle);
  const y = 78 - 68 * Math.sin(angle);
  const dot = document.getElementById("solar-sun-dot");
  const glow = document.getElementById("solar-sun-glow");
  dot.setAttribute("cx", x);
  dot.setAttribute("cy", y);
  glow.setAttribute("cx", x);
  glow.setAttribute("cy", y);
  const visible = progress > 0 && progress < 1 ? "1" : "0.35";
  dot.style.opacity = visible;
  glow.style.opacity = visible;
}

function renderAqi() {
  const cur = state.aqiData?.current;
  const valEl = document.getElementById("aqi-value");
  const badge = document.getElementById("aqi-badge");
  const fill = document.getElementById("aqi-bar-fill");
  const detail = document.getElementById("aqi-detail");

  if (!cur || cur.us_aqi == null) {
    valEl.textContent = "--";
    badge.textContent = "N/A";
    badge.className = "badge";
    detail.textContent = "Air quality data unavailable";
    return;
  }

  const aqi = Math.round(cur.us_aqi);
  valEl.textContent = aqi;
  fill.style.left = `${Math.min(100, (aqi / 200) * 100)}%`;
  detail.textContent = `PM2.5 ${cur.pm2_5?.toFixed(1) ?? "--"} · PM10 ${cur.pm10?.toFixed(1) ?? "--"} µg/m³`;

  if (aqi <= 50) {
    badge.textContent = "Clean";
    badge.className = "badge good";
  } else if (aqi <= 100) {
    badge.textContent = "Moderate";
    badge.className = "badge moderate";
  } else if (aqi <= 150) {
    badge.textContent = "Sensitive";
    badge.className = "badge high";
  } else {
    badge.textContent = "Unhealthy";
    badge.className = "badge severe";
  }
}

// ---------- Area-Wise Weather (Nearby Sectors + Saved Cities) ----------
function buildNearbyCoordinates(city) {
  const latDegPerKm = 1 / 111.32;
  const lonDegPerKm = 1 / (111.32 * Math.max(0.25, Math.cos((city.lat * Math.PI) / 180)));
  const dist = 14; // ~14 km radius around active location
  const offsets = [
    { zone: "Central", dLat: 0, dLon: 0 },
    { zone: "North Sector", dLat: dist * latDegPerKm, dLon: 0 },
    { zone: "Northeast Sector", dLat: dist * 0.75 * latDegPerKm, dLon: dist * 0.75 * lonDegPerKm },
    { zone: "East Sector", dLat: 0, dLon: dist * lonDegPerKm },
    { zone: "South Sector", dLat: -dist * latDegPerKm, dLon: 0 },
    { zone: "West Sector", dLat: 0, dLon: -dist * lonDegPerKm }
  ];

  return offsets.map((o, idx) => ({
    name: idx === 0 ? `${city.name} Central` : `${o.zone.split(" ")[0]} ${city.name}`,
    zone: o.zone,
    region: city.region || "",
    lat: Number((city.lat + o.dLat).toFixed(4)),
    lon: Number((city.lon + o.dLon).toFixed(4))
  }));
}

async function resolveLocalityName(area) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${area.lat}&longitude=${area.lon}&localityLanguage=en`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.locality || data.city || null;
  } catch (_) {
    return null;
  }
}

async function loadAreaWiseWeather(city) {
  const nearbyPts = buildNearbyCoordinates(city);
  const savedPts = state.savedCities;

  try {
    const nearbyLats = nearbyPts.map((p) => p.lat).join(",");
    const nearbyLons = nearbyPts.map((p) => p.lon).join(",");
    const nearbyUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${nearbyLats}&longitude=${nearbyLons}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=auto`;

    const savedLats = savedPts.map((p) => p.lat).join(",");
    const savedLons = savedPts.map((p) => p.lon).join(",");
    const savedUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${savedLats}&longitude=${savedLons}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=auto`;

    const [nRes, sRes] = await Promise.all([fetch(nearbyUrl), fetch(savedUrl)]);
    if (nRes.ok) {
      const nJson = await nRes.json();
      const nArr = Array.isArray(nJson) ? nJson : [nJson];
      state.nearbyAreas = nearbyPts.map((pt, i) => ({
        ...pt,
        weather: nArr[i] || null
      }));
    }
    if (sRes.ok) {
      const sJson = await sRes.json();
      const sArr = Array.isArray(sJson) ? sJson : [sJson];
      savedPts.forEach((c, i) => {
        state.savedWeatherMap[`${c.lat},${c.lon}`] = sArr[i] || null;
      });
    }
    renderAreaGrid();

    // Enrich outer nearby points with real locality names in the background
    const names = await Promise.all(
      nearbyPts.slice(1).map((pt) => resolveLocalityName(pt))
    );
    let updated = false;
    names.forEach((locName, idx) => {
      if (locName && state.nearbyAreas[idx + 1]) {
        state.nearbyAreas[idx + 1].name = locName;
        updated = true;
      }
    });
    if (updated && state.areaTab === "nearby") renderAreaGrid();
  } catch (err) {
    console.warn("Area-wise fetch fallback:", err);
    state.nearbyAreas = nearbyPts.map((pt, i) => ({
      ...pt,
      weather: {
        timezone: state.weatherData?.timezone || "UTC",
        current: {
          temperature_2m: (state.weatherData?.current?.temperature_2m ?? 18) + (i % 3) - 1,
          relative_humidity_2m: (state.weatherData?.current?.relative_humidity_2m ?? 60) + (i % 4),
          weather_code: state.weatherData?.current?.weather_code ?? 1,
          wind_speed_10m: (state.weatherData?.current?.wind_speed_10m ?? 12) + i,
          is_day: state.weatherData?.current?.is_day ?? 1
        }
      }
    }));
    renderAreaGrid();
  }
}

function renderAreaGrid() {
  const grid = document.getElementById("area-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const items =
    state.areaTab === "nearby"
      ? state.nearbyAreas
      : state.savedCities.map((c) => ({
          ...c,
          zone: c.region || "Saved Location",
          weather: state.savedWeatherMap[`${c.lat},${c.lon}`] || null
        }));

  if (!items.length) {
    grid.innerHTML = `<p class="card-subtitle">Loading area-wise conditions...</p>`;
    return;
  }

  items.forEach((item) => {
    const cur = item.weather?.current;
    const tz = item.weather?.timezone || state.weatherData?.timezone || "UTC";
    const wmo = getWmoInfo(cur?.weather_code ?? 1);
    const isNight = cur?.is_day === 0;
    const palette = getCityPalette(item, isNight);
    const isActive =
      state.currentCity &&
      Math.abs(state.currentCity.lat - item.lat) < 0.02 &&
      Math.abs(state.currentCity.lon - item.lon) < 0.02;

    const card = document.createElement("button");
    card.className = "area-card" + (isActive ? " active" : "");
    card.style.setProperty("--area-color", palette.dot);
    card.innerHTML = `
      <div class="area-card-top">
        <div>
          <div class="area-name-row">
            <span class="area-swatch" aria-hidden="true"></span>
            <span class="area-name">${item.name}</span>
          </div>
          <div class="area-zone">${item.zone}</div>
        </div>
        <span class="area-icon">${getWeatherSvg(wmo.icon, isNight)}</span>
      </div>
      <div class="area-card-mid">
        <span class="area-temp mono">${cur ? formatTemp(cur.temperature_2m) : "--°"}</span>
        <span class="area-cond">${cur ? wmo.label : "Loading..."}</span>
      </div>
      <div class="area-card-foot mono">
        <span class="area-time" data-tz="${tz}">${formatAreaClock(tz)}</span>
        <span>${cur ? `${Math.round(cur.relative_humidity_2m)}% · ${toUnitSpeed(cur.wind_speed_10m)} ${speedUnitLabel()}` : "—"}</span>
      </div>
    `;
    card.addEventListener("click", () => {
      fetchCityWeather({
        name: item.name,
        region: item.region || item.zone,
        lat: item.lat,
        lon: item.lon
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    grid.appendChild(card);
  });
}

// ---------- Search & Saved Cities ----------
function renderSavedCities() {
  const bar = document.getElementById("saved-cities");
  bar.innerHTML = "";
  state.savedCities.forEach((city) => {
    const btn = document.createElement("button");
    const isActive =
      state.currentCity &&
      Math.abs(state.currentCity.lat - city.lat) < 0.05 &&
      Math.abs(state.currentCity.lon - city.lon) < 0.05;
    const palette = getCityPalette(city, false);
    btn.className = "city-chip" + (isActive ? " active" : "");
    btn.style.setProperty("--chip-color", palette.dot);
    btn.innerHTML = `<span class="city-chip-dot" aria-hidden="true"></span><span>${city.name}</span>`;
    btn.addEventListener("click", () => fetchCityWeather(city));
    bar.appendChild(btn);
  });
}

function updatePinButton() {
  const btn = document.getElementById("pin-city-btn");
  if (!state.currentCity) return;
  const pinned = state.savedCities.some(
    (c) => Math.abs(c.lat - state.currentCity.lat) < 0.05 && Math.abs(c.lon - state.currentCity.lon) < 0.05
  );
  btn.classList.toggle("pinned", pinned);
}

function togglePinCurrentCity() {
  if (!state.currentCity) return;
  const idx = state.savedCities.findIndex(
    (c) => Math.abs(c.lat - state.currentCity.lat) < 0.05 && Math.abs(c.lon - state.currentCity.lon) < 0.05
  );
  if (idx >= 0) {
    if (state.savedCities.length > 1) state.savedCities.splice(idx, 1);
  } else {
    state.savedCities.unshift(state.currentCity);
    if (state.weatherData) {
      state.savedWeatherMap[`${state.currentCity.lat},${state.currentCity.lon}`] = state.weatherData;
    }
  }
  persistSavedCities();
  renderSavedCities();
  updatePinButton();
  if (state.areaTab === "saved") renderAreaGrid();
}

let searchTimer = null;
async function handleSearchInput(query) {
  const resultsEl = document.getElementById("search-results");
  if (!query || query.trim().length < 2) {
    resultsEl.hidden = true;
    resultsEl.innerHTML = "";
    return;
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query.trim()
    )}&count=6&language=en&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    const list = data.results || [];
    if (list.length === 0) {
      resultsEl.innerHTML = `<li><span>No matching locations found</span></li>`;
      resultsEl.hidden = false;
      return;
    }

    resultsEl.innerHTML = "";
    list.forEach((loc) => {
      const region = [loc.admin2, loc.admin1, loc.country].filter(Boolean).join(", ");
      const li = document.createElement("li");
      li.innerHTML = `<span>${loc.name}</span><span class="search-result-sub">${region}</span>`;
      li.addEventListener("click", () => {
        resultsEl.hidden = true;
        document.getElementById("city-search").value = "";
        fetchCityWeather({
          name: loc.name,
          region,
          lat: loc.latitude,
          lon: loc.longitude
        });
      });
      resultsEl.appendChild(li);
    });
    resultsEl.hidden = false;
  } catch (err) {
    console.warn("Search error:", err);
  }
}

function useBrowserLocation() {
  if (!navigator.geolocation) {
    setBanner("Geolocation is not supported by your browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      fetchCityWeather({
        name: "My Location",
        region: `${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`,
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      });
    },
    () => {
      setBanner("Location access was denied. You can search any city above.");
    }
  );
}

function setBanner(msg) {
  const el = document.getElementById("status-banner");
  if (!msg) {
    el.hidden = true;
    el.textContent = "";
  } else {
    el.hidden = false;
    el.textContent = msg;
  }
}

// ---------- Weather-Reactive Atmospheric Canvas ----------
const particlesEngine = (() => {
  const canvas = document.getElementById("atmosphere-canvas");
  const ctx = canvas.getContext("2d");
  let mode = "clear-day";
  let weatherFlags = { isStorm: false, isFog: false, isCloudy: false };
  let items = [];
  let clouds = [];
  let shootingStar = null;
  let flashAlpha = 0;
  let w = 0;
  let h = 0;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    seed();
  }

  function seed() {
    items = [];
    const count = mode === "rain" ? 130 : mode === "snow" ? 85 : mode === "night" ? 105 : 34;
    for (let i = 0; i < count; i++) {
      items.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: mode === "rain" ? 1.1 : mode === "snow" ? 1.4 + Math.random() * 2.8 : 0.8 + Math.random() * 1.9,
        vx: mode === "rain" ? -1.8 : (Math.random() - 0.5) * 0.45,
        vy: mode === "rain" ? 11 + Math.random() * 6 : mode === "snow" ? 0.7 + Math.random() * 1.4 : -0.16,
        alpha: 0.16 + Math.random() * 0.65,
        phase: Math.random() * Math.PI * 2
      });
    }

    clouds = Array.from({ length: 5 }, (_, idx) => ({
      x: (w / 5) * idx,
      y: h * (0.1 + Math.random() * 0.45),
      rx: 180 + Math.random() * 160,
      ry: 42 + Math.random() * 26,
      vx: 0.18 + Math.random() * 0.22
    }));
  }

  function setMode(next) {
    if (next === mode) return;
    mode = next;
    seed();
  }

  function setWeatherState(nextState) {
    weatherFlags = {
      isStorm: Boolean(nextState.isStorm),
      isFog: Boolean(nextState.isFog),
      isCloudy: Boolean(nextState.isCloudy)
    };
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);

    // Subtle sunbeam glow on clear/golden daylight
    if (mode === "clear-day" || mode === "golden-dusk") {
      const grad = ctx.createRadialGradient(w * 0.85, h * 0.08, 10, w * 0.85, h * 0.08, w * 0.48);
      grad.addColorStop(0, mode === "golden-dusk" ? "rgba(253, 186, 116, 0.16)" : "rgba(254, 240, 138, 0.14)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // Soft drifting mist / cloud layers when cloudy, foggy, or rainy
    if (weatherFlags.isCloudy || weatherFlags.isFog || mode === "rain") {
      for (const c of clouds) {
        c.x += c.vx;
        if (c.x - c.rx > w) c.x = -c.rx;
        const cg = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, c.rx);
        const op = weatherFlags.isFog ? 0.13 : 0.07;
        cg.addColorStop(0, `rgba(226, 232, 240, ${op})`);
        cg.addColorStop(1, "rgba(226, 232, 240, 0)");
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Occasional lightning glow in thunderstorms
    if (weatherFlags.isStorm && Math.random() < 0.004) {
      flashAlpha = 0.24;
    }
    if (flashAlpha > 0.005) {
      ctx.fillStyle = `rgba(224, 242, 254, ${flashAlpha})`;
      ctx.fillRect(0, 0, w, h);
      flashAlpha *= 0.86;
    }

    // Occasional shooting star on night sky
    if (mode === "night" && !shootingStar && Math.random() < 0.003) {
      shootingStar = { x: Math.random() * w * 0.8, y: Math.random() * h * 0.3, vx: 8, vy: 3.5, life: 1 };
    }
    if (shootingStar) {
      ctx.strokeStyle = `rgba(224, 231, 255, ${shootingStar.life * 0.7})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(shootingStar.x, shootingStar.y);
      ctx.lineTo(shootingStar.x - shootingStar.vx * 4, shootingStar.y - shootingStar.vy * 4);
      ctx.stroke();
      shootingStar.x += shootingStar.vx;
      shootingStar.y += shootingStar.vy;
      shootingStar.life -= 0.035;
      if (shootingStar.life <= 0) shootingStar = null;
    }

    for (const p of items) {
      if (mode === "rain") {
        ctx.strokeStyle = `rgba(186, 230, 253, ${p.alpha * 0.45})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 1.4, p.y + 15);
        ctx.stroke();
        p.x += p.vx;
        p.y += p.vy;
      } else if (mode === "snow") {
        p.phase += 0.02;
        p.x += Math.sin(p.phase) * 0.55 + p.vx;
        p.y += p.vy;
        ctx.fillStyle = `rgba(241, 245, 249, ${p.alpha * 0.78})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (mode === "night") {
        p.phase += 0.025;
        const twinkle = p.alpha * (0.45 + 0.55 * Math.sin(p.phase));
        ctx.fillStyle = `rgba(224, 231, 255, ${twinkle})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        p.x += p.vx;
        p.y += p.vy;
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.22})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (p.y > h + 20) {
        p.y = -15;
        p.x = Math.random() * w;
      } else if (p.y < -20) {
        p.y = h + 15;
        p.x = Math.random() * w;
      }
      if (p.x < -20) p.x = w + 15;
      if (p.x > w + 20) p.x = -15;
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  resize();
  tick();
  return { setMode, setWeatherState };
})();

// ---------- Event Wiring ----------
function init() {
  const searchInput = document.getElementById("city-search");
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => handleSearchInput(e.target.value), 260);
  });
  searchInput.addEventListener("keydown", (e) => {
    const resultsEl = document.getElementById("search-results");
    if (e.key === "Escape") {
      resultsEl.hidden = true;
    } else if (e.key === "Enter" && !resultsEl.hidden) {
      const firstChoice = resultsEl.querySelector("li");
      if (firstChoice) firstChoice.click();
    }
  });

  document.addEventListener("click", (e) => {
    if (!document.getElementById("search-wrap").contains(e.target)) {
      document.getElementById("search-results").hidden = true;
    }
    if (!e.target.closest(".mood-select-wrap")) {
      document.getElementById("mood-menu").hidden = true;
    }
  });

  document.getElementById("geo-btn").addEventListener("click", useBrowserLocation);
  document.getElementById("pin-city-btn").addEventListener("click", togglePinCurrentCity);
  initVoiceSearch();

  document.querySelectorAll(".unit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".unit-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.unit = btn.dataset.unit;
      renderDashboard();
    });
  });

  const moodBtn = document.getElementById("mood-toggle-btn");
  const moodMenu = document.getElementById("mood-menu");
  moodBtn.addEventListener("click", () => {
    moodMenu.hidden = !moodMenu.hidden;
  });

  moodMenu.querySelectorAll("button").forEach((opt) => {
    opt.addEventListener("click", () => {
      moodMenu.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      opt.classList.add("active");
      state.moodOverride = opt.dataset.mood;
      document.getElementById("mood-label").textContent =
        opt.dataset.mood === "auto" ? "City Colour" : opt.textContent;
      moodMenu.hidden = true;
      renderDashboard();
    });
  });

  document.querySelectorAll(".area-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".area-tab").forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      state.areaTab = tab.dataset.areaTab;
      renderAreaGrid();
    });
  });

  startLiveClocks();
  fetchCityWeather(state.savedCities[0]);
}

function initVoiceSearch() {
  const voiceBtn = document.getElementById("voice-btn");
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!voiceBtn) return;

  if (!SpeechRec) {
    voiceBtn.title = "Voice search not supported in this browser";
    voiceBtn.addEventListener("click", () => {
      setBanner("Voice search requires Chrome, Edge, or Safari speech support.");
    });
    return;
  }

  voiceBtn.addEventListener("click", () => {
    const rec = new SpeechRec();
    rec.lang = "en-US";
    rec.interimResults = false;
    voiceBtn.classList.add("listening");

    rec.onresult = (event) => {
      const spoken = event.results[0]?.[0]?.transcript || "";
      const cleaned = spoken
        .replace(/^(what('s| is)? the )?weather (like )?(in|for|at) /i, "")
        .replace(/\b(today|tomorrow|now)\b/gi, "")
        .trim();
      const searchInput = document.getElementById("city-search");
      searchInput.value = cleaned || spoken;
      handleSearchInput(searchInput.value);
    };
    rec.onerror = () => {
      voiceBtn.classList.remove("listening");
    };
    rec.onend = () => {
      voiceBtn.classList.remove("listening");
    };
    rec.start();
  });
}

init();
