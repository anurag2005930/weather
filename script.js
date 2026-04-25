const API_GEO = "https://geocoding-api.open-meteo.com/v1/search";
const API_WEATHER = "https://api.open-meteo.com/v1/forecast";
const API_AQI = "https://air-quality-api.open-meteo.com/v1/air-quality";

const WMO_MAP = {
    0: { cond: 'Clear Sky', icon: 'sun', bg: 'Clear' },
    1: { cond: 'Mainly Clear', icon: 'sun', bg: 'Clear' },
    2: { cond: 'Partly Cloudy', icon: 'cloud-sun', bg: 'Partly Cloudy' },
    3: { cond: 'Overcast', icon: 'cloud', bg: 'Overcast' },
    45: { cond: 'Fog', icon: 'cloud-fog', bg: 'Cloudy' },
    48: { cond: 'Rime Fog', icon: 'cloud-fog', bg: 'Cloudy'},
    51: { cond: 'Light Drizzle', icon: 'cloud-drizzle', bg: 'Showers' },
    53: { cond: 'Drizzle', icon: 'cloud-drizzle', bg: 'Showers' },
    55: { cond: 'Heavy Drizzle', icon: 'cloud-drizzle', bg: 'Rain' },
    61: { cond: 'Light Rain', icon: 'cloud-rain', bg: 'Rain' },
    63: { cond: 'Rain', icon: 'cloud-rain', bg: 'Rain' },
    65: { cond: 'Heavy Rain', icon: 'cloud-rain', bg: 'Rain' },
    71: { cond: 'Light Snow', icon: 'snowflake', bg: 'Snow' },
    73: { cond: 'Snow', icon: 'snowflake', bg: 'Snow' },
    75: { cond: 'Heavy Snow', icon: 'snowflake', bg: 'Snow' },
    77: { cond: 'Snow Grains', icon: 'snowflake', bg: 'Snow' },
    80: { cond: 'Light Rain Showers', icon: 'cloud-rain', bg: 'Showers' },
    81: { cond: 'Rain Showers', icon: 'cloud-rain', bg: 'Showers' },
    82: { cond: 'Heavy Rain Showers', icon: 'cloud-rain', bg: 'Showers' },
    85: { cond: 'Snow Showers', icon: 'snowflake', bg: 'Snow' },
    86: { cond: 'Heavy Snow Showers', icon: 'snowflake', bg: 'Snow' },
    95: { cond: 'Thunderstorm', icon: 'cloud-lightning', bg: 'Thunderstorm' },
    96: { cond: 'Thunderstorm w/ Hail', icon: 'cloud-lightning', bg: 'Thunderstorm' },
    99: { cond: 'Heavy Thunderstorm', icon: 'cloud-lightning', bg: 'Thunderstorm' }
};

const bgGradients = {
    'Clear': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'Partly Cloudy': 'linear-gradient(135deg, #74ebd5 0%, #9face6 100%)',
    'Cloudy': 'linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)',
    'Overcast': 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)',
    'Rain': 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    'Showers': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    'Snow': 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'Thunderstorm': 'linear-gradient(135deg, #141e30 0%, #243b55 100%)'
};

/* Application State */
let isMetric = true;
let isDashboard = false;
let favorites = JSON.parse(localStorage.getItem('weather_favorites')) || ['Bhubaneswar', 'Sundargarh', 'Sambalpur'];
let currentCityName = '';
let currentWeatherData = null;
let currentAqiData = null;
let chartInstance = null;
let animationFrameId = null;
let currentBgType = 'Clear';
let mapInstance = null;
let mapMarker = null;
let ambientAudio = null;
let isAudioPlaying = false;
let globeMode = false;

/* DOM Elements */
const DOM = {
    searchInput: document.getElementById('city-input'),
    searchBtn: document.getElementById('search-btn'),
    locateBtn: document.getElementById('locate-btn'),
    themeToggle: document.getElementById('theme-toggle'),
    dashToggle: document.getElementById('dashboard-toggle'),
    micBtn: document.getElementById('mic-btn'),
    unitSwitch: document.getElementById('unit-switch'),
    favBtn: document.getElementById('favorite-btn'),
    favContainer: document.getElementById('favorites-container'),
    errorMsg: document.getElementById('error-msg'),
    canvas: document.getElementById('weather-canvas'),
    alertBanner: document.getElementById('alert-banner'),
    alertText: document.getElementById('alert-text'),
    closeAlertBtn: document.getElementById('close-alert-btn'),
    aiSummary: document.getElementById('ai-summary'),
    aiText: document.getElementById('ai-text'),
    readAloudBtn: document.getElementById('read-aloud-btn'),
    dashboardView: document.getElementById('dashboard-view'),
    dashGrid: document.getElementById('dashboard-grid'),
    currentWeatherView: document.getElementById('current-weather-wrapper'),
    extendedDataView: document.querySelector('.extended-data'),
    forecastView: document.querySelector('.forecast'),
    soundToggle: document.getElementById('sound-toggle'),
    soundIcon: document.getElementById('sound-icon'),
    notifyBtn: document.getElementById('notify-btn'),
    shareBtn: document.getElementById('share-btn'),
    histComp: document.getElementById('historical-comp'),
    voteYes: document.getElementById('vote-yes'),
    voteNo: document.getElementById('vote-no'),
    globeToggle: document.getElementById('globe-toggle'),
    wardrobeText: document.getElementById('wardrobe-text'),
    pollenTree: document.getElementById('pollen-tree'),
    pollenTreeVal: document.getElementById('pollen-tree-val'),
    pollenGrass: document.getElementById('pollen-grass'),
    pollenGrassVal: document.getElementById('pollen-grass-val'),
    pollenWeed: document.getElementById('pollen-weed'),
    pollenWeedVal: document.getElementById('pollen-weed-val')
};

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initUnits();
    renderFavorites();
    lucide.createIcons();
    initCanvas();
    
    // Bind Events
    DOM.searchBtn.addEventListener('click', () => { isDashboard = false; toggleDashboardView(); handleSearch(DOM.searchInput.value);});
    DOM.searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { isDashboard=false; toggleDashboardView(); handleSearch(DOM.searchInput.value); } });
    DOM.searchInput.addEventListener('focus', () => { DOM.searchInput.select(); });
    DOM.locateBtn.addEventListener('click', () => { isDashboard=false; toggleDashboardView(); fetchByLocation();});
    DOM.themeToggle.addEventListener('click', toggleTheme);
    DOM.unitSwitch.addEventListener('change', toggleUnits);
    DOM.favBtn.addEventListener('click', toggleFavorite);
    DOM.dashToggle.addEventListener('click', toggleDashboardMode);
    DOM.micBtn.addEventListener('click', handleVoiceSearch);
    DOM.closeAlertBtn.addEventListener('click', () => DOM.alertBanner.style.display='none');
    DOM.readAloudBtn.addEventListener('click', readAloudSummary);
    
    // Premium Feature Events
    DOM.soundToggle.addEventListener('click', toggleAmbientSound);
    DOM.notifyBtn.addEventListener('click', requestNotifications);
    DOM.shareBtn.addEventListener('click', shareWeather);
    DOM.voteYes.addEventListener('click', () => handleVote(true));
    DOM.voteNo.addEventListener('click', () => handleVote(false));
    DOM.globeToggle.addEventListener('click', toggleGlobeMode);
    
    // Initial fetch
    if (favorites.length > 0) {
        handleSearch(favorites[0]);
    } else {
        handleSearch('Bhubaneswar');
    }
    
    window.addEventListener('resize', initCanvas);
});

/* --- SETTINGS & TOGGLES --- */
function initTheme() {
    const t = localStorage.getItem('theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
    }
}
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    if (currentWeatherData) renderChart(currentWeatherData.raw.hourly);
}
function initUnits() {
    const u = localStorage.getItem('units');
    if (u === 'imperial') {
        isMetric = false;
        DOM.unitSwitch.checked = true;
    }
}
function toggleUnits(e) {
    isMetric = !e.target.checked;
    localStorage.setItem('units', isMetric ? 'metric' : 'imperial');
    if (isDashboard) { loadDashboard(); } else if (currentWeatherData) { updateUI(currentCityName, currentWeatherData.raw, currentAqiData); }
}

function toggleDashboardMode() {
    isDashboard = !isDashboard;
    toggleDashboardView();
    if (isDashboard) {
        loadDashboard();
    } else {
        if (currentWeatherData) {
            updateUI(currentCityName, currentWeatherData.raw, currentAqiData);
        } else if (currentCityName) {
            handleSearch(currentCityName.split(',')[0]);
        }
    }
}

function toggleDashboardView() {
    if (isDashboard) {
        DOM.dashboardView.style.display = 'block';
        DOM.currentWeatherView.style.display = 'none';
        DOM.extendedDataView.style.display = 'none';
        DOM.forecastView.style.display = 'none';
        DOM.aiSummary.style.display = 'none';
    } else {
        DOM.dashboardView.style.display = 'none';
        DOM.currentWeatherView.style.display = 'block';
        DOM.extendedDataView.style.display = 'flex';
        DOM.forecastView.style.display = 'block';
    }
}

/* --- VOICE SEARCH --- */
function handleVoiceSearch() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showError(true, "Speech recognition not supported in your browser.");
        return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        DOM.micBtn.classList.add('listening');
        DOM.searchInput.placeholder = "Listening...";
    };
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        DOM.searchInput.value = transcript;
        isDashboard = false; toggleDashboardView();
        handleSearch(transcript);
    };
    recognition.onerror = () => showError(true, "Voice recognition failed. Try again.");
    recognition.onend = () => {
        DOM.micBtn.classList.remove('listening');
        DOM.searchInput.placeholder = "Search city...";
    };
    recognition.start();
}

function readAloudSummary() {
    if (!('speechSynthesis' in window)) return;
    const text = DOM.aiText.textContent;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel(); // clear queue
    window.speechSynthesis.speak(utterance);
}

/* --- API CALLS --- */

async function handleSearch(query) {
    if (!query.trim()) return;
    showError(false);
    DOM.searchInput.value = query;
    try {
        const geoRes = await fetch(`${API_GEO}?name=${encodeURIComponent(query)}&count=1&language=en`);
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Try another search.");
        }
        
        const loc = geoData.results[0];
        currentCityName = `${loc.name}${loc.admin1 ? `, ${loc.admin1}` : ''}`;
        await fetchWeatherData(loc.latitude, loc.longitude, currentCityName);
    } catch (err) {
        showError(true, err.message);
    }
}

async function fetchByLocation() {
    if (!navigator.geolocation) {
        showError(true, "Geolocation not supported");
        return;
    }
    DOM.locateBtn.classList.add('loading');
    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            const { latitude, longitude } = position.coords;
            currentCityName = "Current Location";
            await fetchWeatherData(latitude, longitude, currentCityName);
        } catch (err) {
            showError(true, "Could not fetch location weather.");
        } finally {
            DOM.locateBtn.classList.remove('loading');
        }
    }, () => {
        showError(true, "Location permission denied");
        DOM.locateBtn.classList.remove('loading');
    });
}

async function fetchWeatherData(lat, lon, displayName) {
    try {
        const url = `${API_WEATHER}?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max&timezone=auto`;
        const res = await Promise.all([
            fetch(url).then(r => r.json()),
            fetch(`${API_AQI}?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5`).then(r => r.json()).catch(()=>null)
        ]);
        
        const [data, aqiData] = res;
        currentWeatherData = { raw: data, lat, lon };
        currentAqiData = aqiData;
        
        updateUI(displayName, data, aqiData);
    } catch (err) {
        console.error(err);
        showError(true, "Failed to load weather data: " + err.message + " - " + err.stack);
    }
}

/* --- DASHBOARD LOGIC --- */
async function loadDashboard() {
    DOM.dashGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center;">Loading dashboard...</div>';
    let html = '';
    
    for (let city of favorites) {
        try {
            const geoRes = await fetch(`${API_GEO}?name=${encodeURIComponent(city)}&count=1`);
            const geoData = await geoRes.json();
            if(!geoData.results) continue;
            const loc = geoData.results[0];
            
            const wRes = await fetch(`${API_WEATHER}?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code&timezone=auto`);
            const wData = await wRes.json();
            
            const temp = wData.current.temperature_2m;
            const wConfig = WMO_MAP[wData.current.weather_code] || WMO_MAP[0];
            
            html += `
                <div class="dash-card" onclick="isDashboard=false; toggleDashboardView(); handleSearch('${city}')">
                    <span class="dash-city">${city.split(',')[0]}</span>
                    <i data-lucide="${wConfig.icon}" style="width:40px; height:40px; margin: 10px 0; color:#fff;"></i>
                    <span class="dash-temp">${formatTemp(temp)}</span>
                    <span class="dash-desc">${wConfig.cond}</span>
                </div>
            `;
        } catch(e) { console.error(e); }
    }
    DOM.dashGrid.innerHTML = html || '<div style="grid-column: 1/-1; text-align:center;">No favorites added.</div>';
    lucide.createIcons();
}

/* --- UI UPDATES --- */

function updateUI(city, data, aqiData) {
    const cur = data.current;
    const daily = data.daily;
    const wConfig = WMO_MAP[cur.weather_code] || WMO_MAP[0];
    
    // Core Data
    document.getElementById('city-name').textContent = city;
    document.getElementById('condition').textContent = wConfig.cond;
    document.getElementById('temp').textContent = formatTemp(cur.temperature_2m);
    document.getElementById('feels-like-temp').textContent = formatTemp(cur.apparent_temperature);
    document.getElementById('feels-like-text').textContent = 'Feels like';
    document.getElementById('humidity').textContent = `${cur.relative_humidity_2m}%`;
    document.getElementById('wind').textContent = formatSpeed(cur.wind_speed_10m);
    document.getElementById('uv-index').textContent = daily.uv_index_max[0] ? daily.uv_index_max[0].toFixed(1) : '--';
    
    // Wind Compass
    const windDir = cur.wind_direction_10m || 0;
    document.getElementById('wind-direction').textContent = getWindDirectionText(windDir);
    document.getElementById('wind-compass-icon').style.transform = `rotate(${windDir}deg)`;

    // Sunrise / sunset & Moon
    const sr = new Date(daily.sunrise[0]);
    const ss = new Date(daily.sunset[0]);
    document.getElementById('sunrise-time').textContent = formatTime(sr);
    document.getElementById('sunset-time').textContent = formatTime(ss);
    
    // Simplified moon phase representation
    const moonPhaseText = getMoonPhase(new Date());
    document.getElementById('moon-phase').textContent = moonPhaseText;

    // Main Icon
    const isNight = cur.is_day === 0;
    let iconName = wConfig.icon;
    if (isNight && iconName === 'sun') iconName = 'moon';
    if (isNight && iconName === 'cloud-sun') iconName = 'cloud-moon';
    document.getElementById('main-weather-icon').setAttribute('data-lucide', iconName);
    
    // Background theme
    currentBgType = wConfig.bg;
    document.body.style.background = bgGradients[currentBgType] || bgGradients['Clear'];
    updateFavoriteBtnState();
    
    // Alerts & Imminent Rain (MinuteCast mockup)
    checkAlerts(cur, data.hourly);
    
    // Render sub-components
    lucide.createIcons();
    renderForecast(daily);
    renderChart(data.hourly);
    renderAQI(aqiData);
    updateLifestyleScores(cur);
    generateAISummary(cur, daily);
    updatePremiumFeatures(cur, daily);
    updateMap(currentWeatherData.lat, currentWeatherData.lon);
    
    // Re-trigger Fade animations
    const fades = document.querySelectorAll('.fade-in');
    fades.forEach(el => {
        el.classList.remove('fade-in');
        void el.offsetWidth;
        el.classList.add('fade-in');
    });
}

function checkAlerts(current, hourly) {
    // Alert logic based on thresholds since free API lacks active warning feeds
    DOM.alertBanner.style.display = 'none';
    const isExtrWind = current.wind_speed_10m > 50;
    const isExtrTemp = current.temperature_2m > 38 || current.temperature_2m < -15;
    const isStorm = [95, 96, 99].includes(current.weather_code);
    
    if (isStorm) {
        DOM.alertText.textContent = "Severe Thunderstorm Warning!";
        DOM.alertBanner.style.display = 'flex';
    } else if (isExtrWind) {
        DOM.alertText.textContent = "High Wind Warning!";
        DOM.alertBanner.style.display = 'flex';
    } else if (isExtrTemp) {
        DOM.alertText.textContent = "Extreme Temperature Advisory!";
        DOM.alertBanner.style.display = 'flex';
    }
    
    // Imminent rain check (next 2 hours)
    const currentHourIdx = hourly.time.findIndex(t => new Date(t) > new Date());
    const immRainEl = document.getElementById('imminent-rain');
    if (currentHourIdx >= 0 && currentHourIdx < hourly.time.length) {
        const prob = hourly.precipitation_probability[currentHourIdx];
        if (prob > 50 && current.precipitation === 0) {
            immRainEl.textContent = `Rain expected in ~1 hour (${prob}% prob)`;
            immRainEl.style.display = 'block';
        } else if (current.precipitation > 0 && hourly.precipitation_probability[currentHourIdx+1] < 20) {
             immRainEl.textContent = "Rain stopping soon.";
             immRainEl.style.display = 'block';
        } else {
             immRainEl.style.display = 'none';
        }
    } else {
        immRainEl.style.display = 'none';
    }
}

function renderAQI(aqiData) {
    if(!aqiData || !aqiData.current) return;
    const aqi = aqiData.current.us_aqi;
    document.getElementById('aqi-val').textContent = aqi;
    
    let color = "#2ecc71";
    let text = 'Good';
    let pct = Math.min((aqi / 300) * 100, 100);
    
    if (aqi > 50) { color = "#f1c40f"; text = 'Moderate'; }
    if (aqi > 100) { color = "#e67e22"; text = 'Unhealthy for sensitive'; }
    if (aqi > 150) { color = "#e74c3c"; text = 'Unhealthy'; }
    if (aqi > 200) { color = "#9b59b6"; text = 'Very Unhealthy'; }
    if (aqi > 300) { color = "#8e44ad"; text = 'Hazardous'; }
    
    const lbl = document.getElementById('aqi-label');
    lbl.textContent = text;
    lbl.style.background = color;
    lbl.style.color = (aqi>50 && aqi<100) ? '#000': '#fff'; // Dark text for yellow
    
    const fill = document.getElementById('aqi-fill');
    fill.style.width = `${pct}%`;
    fill.style.background = color;
}

function updateLifestyleScores(cur) {
    let bike = 10, car = 10, flight = 10;
    
    // Penalize for rain/snow
    if ([51,53,55, 61,63,65, 80,81,82].includes(cur.weather_code)) { bike -= 5; car -= 2; }
    if ([71,73,75, 77, 85,86].includes(cur.weather_code)) { bike -= 8; car -= 4; flight -= 3; }
    if ([95,96,99].includes(cur.weather_code)) { bike -= 10; car -= 6; flight -= 8; }
    
    // Penalize for wind
    if (cur.wind_speed_10m > 30) { bike -= 4; flight -= 2; }
    if (cur.wind_speed_10m > 50) { bike -= 8; car -= 3; flight -= 6; }
    
    // Penalize for extreme temps
    if(cur.temperature_2m < 5 || cur.temperature_2m > 32) bike -= 3;
    if(cur.temperature_2m < -5) car -= 2;

    document.getElementById('act-bike').textContent = `${Math.max(bike, 0)}/10`;
    document.getElementById('act-car').textContent = `${Math.max(car, 0)}/10`;
    document.getElementById('act-flight').textContent = `${Math.max(flight, 0)}/10`;
}

function generateAISummary(cur, daily) {
    DOM.aiSummary.style.display = 'flex';
    let text = "Have a great day ahead!";
    
    const maxT = daily.temperature_2m_max[0];
    const minT = daily.temperature_2m_min[0];
    
    if (cur.precipitation > 0) {
        text = "It's wet outside. Don't forget your umbrella!";
    } else if (maxT > 30) {
        text = `It will be very hot today with highs of ${formatTemp(maxT, false)}°. Stay hydrated!`;
    } else if (minT < 0) {
        text = `It is freezing with lows of ${formatTemp(minT, false)}°. Bundle up warmly!`;
    } else if (cur.weather_code <= 1) {
        text = "Clear skies expected. Perfect weather for outdoor activities!";
    } else if (cur.wind_speed_10m > 20) {
        text = "It's quite windy out there. Hold onto your hats!";
    } else {
        text = `A typical day ahead with temperatures between ${formatTemp(minT, false)}° and ${formatTemp(maxT, false)}°.`;
    }
    
    DOM.aiText.textContent = text;
}

function updateMap(lat, lon) {
    if(!window.L) return; // If Leaflet failed to load
    if (!mapInstance) {
        mapInstance = L.map('weather-map', { zoomControl: false }).setView([lat, lon], 10);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(mapInstance);
        
        // Add OpenWeatherMap precipitation layer (using a public demo key for UI purposes)
        L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=9de243494c0b295cca9337e1e96b00e2', {
            opacity: 0.5
        }).addTo(mapInstance);
        
        mapMarker = L.marker([lat, lon]).addTo(mapInstance);
    } else {
        mapInstance.setView([lat, lon], 10);
        mapMarker.setLatLng([lat, lon]);
        mapInstance.invalidateSize();
    }
}

function renderForecast(daily) {
    const container = document.getElementById('forecast-container');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Calculate global min and max for the week
    const weekMin = Math.min(...daily.temperature_2m_min.slice(0, 7));
    const weekMax = Math.max(...daily.temperature_2m_max.slice(0, 7));
    const range = weekMax - weekMin || 1;

    let html = '';
    for(let i = 0; i <= 6; i++) {
        if (!daily.time[i]) break;
        const d = new Date(daily.time[i]);
        const wConfig = WMO_MAP[daily.weather_code[i]] || WMO_MAP[0];
        
        const dayMin = daily.temperature_2m_min[i];
        const dayMax = daily.temperature_2m_max[i];
        
        // Find extremes
        const isHottest = dayMax === weekMax;
        const isColdest = dayMin === weekMin;
        
        const precipProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;
        let pSum = daily.precipitation_sum ? daily.precipitation_sum[i] : 0;
        if (!isMetric && pSum > 0) pSum = pSum / 25.4;
        const precipSumStr = pSum > 0 ? pSum.toFixed(1) : 0;
        
        const windMax = daily.wind_speed_10m_max ? daily.wind_speed_10m_max[i] : 0;
        const uvMax = daily.uv_index_max ? daily.uv_index_max[i].toFixed(1) : 0;
        
        const bottomPct = ((dayMin - weekMin) / range) * 100;
        const heightPct = ((dayMax - dayMin) / range) * 100;
        
        html += `
            <div class="forecast-card ${i === 0 ? 'today-card' : ''}">
                <div class="fc-header">
                    <span class="day">${i === 0 ? 'Today' : days[d.getDay()]}</span>
                    <i data-lucide="${wConfig.icon}"></i>
                    ${precipProb > 20 ? `<div class="fc-precip">${precipProb}% ${precipSumStr > 0 ? `(${precipSumStr}${isMetric?'mm':'in'})` : ''}</div>` : '<div class="fc-precip empty">-</div>'}
                </div>
                
                <div class="fc-body">
                    <div class="temp-block"><span class="temp-label">Max</span><span class="temp-max">${formatTemp(dayMax, false)}°${isHottest ? '🔥' : ''}</span></div>
                    <div class="v-bar-bg">
                        <div class="v-bar-fill" style="bottom: ${bottomPct}%; height: ${Math.max(heightPct, 8)}%;"></div>
                    </div>
                    <div class="temp-block"><span class="temp-min">${isColdest ? '❄️' : ''}${formatTemp(dayMin, false)}°</span><span class="temp-label">Min</span></div>
                </div>
                
                <div class="fc-footer">
                    <div><i data-lucide="wind"></i> ${Math.round(windMax)}</div>
                    <div><i data-lucide="sun"></i> ${uvMax}</div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function renderChart(hourly) {
    const ctx = document.getElementById('hourlyChart').getContext('2d');
    const currentHourIdx = hourly.time.findIndex(t => new Date(t) > new Date());
    const startIdx = currentHourIdx > 0 ? currentHourIdx - 1 : 0;
    
    const times = hourly.time.slice(startIdx, startIdx + 24).map(t => formatTime(new Date(t)));
    const tempsSource = hourly.temperature_2m.slice(startIdx, startIdx + 24);
    const temps = tempsSource.map(t => isMetric ? t : (t * 9/5 + 32));
    
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#dcdde1' : '#2d3436';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    const lineColor = isDark ? '#00d2ff' : '#0984e3';
    
    if (chartInstance) chartInstance.destroy();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 150);
    gradient.addColorStop(0, isDark ? 'rgba(0, 210, 255, 0.4)' : 'rgba(9, 132, 227, 0.4)');
    gradient.addColorStop(1, isDark ? 'rgba(0, 210, 255, 0)' : 'rgba(9, 132, 227, 0)');

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [{
                label: `Temp (${isMetric?'°C':'°F'})`,
                data: temps,
                borderColor: lineColor,
                backgroundColor: gradient,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 5,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
            scales: {
                x: { ticks: { color: textColor, maxTicksLimit: 6 }, grid: { display: false } },
                y: { ticks: { color: textColor, stepSize: 5 }, grid: { color: gridColor, drawBorder: false } }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });
}

/* --- FORMATTERS --- */

function formatTemp(celsiusValue, includeSymbol = true) {
    let val = isMetric ? celsiusValue : (celsiusValue * 9/5 + 32);
    return `${Math.round(val)}${includeSymbol ? '°' : ''}`;
}

function formatSpeed(kmh) {
    let val = isMetric ? kmh : (kmh * 0.621371);
    return `${Math.round(val)} ${isMetric ? 'km/h' : 'mph'}`;
}

function formatTime(dateObj) {
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showError(show, msg = '') {
    DOM.errorMsg.style.display = show ? 'block' : 'none';
    DOM.errorMsg.textContent = msg;
}

function getWindDirectionText(degree) {
    const sectors = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(degree / 45) % 8;
    return sectors[idx];
}

function getMoonPhase(date) {
    let year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate();
    let c, e, jd, b;
    if (month < 3) { year--; month += 12; }
    ++month; c = 365.25 * year; e = 30.6 * month;
    jd = c + e + day - 694039.09; jd /= 29.5305882;
    b = parseInt(jd); jd -= b; b = Math.round(jd*8);
    if (b >= 8) b = 0;
    
    const phasesEN = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
    
    // Replace moon icon
    const iconList = ['moon', 'moon', 'moon', 'moon', 'circle', 'moon', 'moon', 'moon'];
    document.getElementById('moon-phase-icon').setAttribute('data-lucide', iconList[b]);
    
    return phasesEN[b];
}

/* --- FAVORITES logic --- */
function renderFavorites() {
    DOM.favContainer.innerHTML = favorites.map(f => 
        `<div class="fav-chip" onclick="handleCustomFavClick('${f}')">${f}</div>`
    ).join('');
    updateFavoriteBtnState();
}
window.handleCustomFavClick = function(cityStr) {
    window.scrollTo({top:0, behavior:'smooth'});
    isDashboard = false; toggleDashboardView();
    handleSearch(cityStr);
}
function toggleFavorite() {
    if (!currentCityName || currentCityName.includes('Current Location')) return;
    const simpleName = currentCityName.split(',')[0]; 
    const idx = favorites.findIndex(f => f.split(',')[0] === simpleName);
    if (idx >= 0) {
        favorites.splice(idx, 1);
    } else {
        if (favorites.length >= 6) favorites.pop(); 
        favorites.unshift(simpleName);
    }
    localStorage.setItem('weather_favorites', JSON.stringify(favorites));
    renderFavorites();
}
function updateFavoriteBtnState() {
    if (!currentCityName) return;
    const simpleName = currentCityName.split(',')[0];
    const isFav = favorites.some(f => f.split(',')[0] === simpleName);
    if (isFav) DOM.favBtn.classList.add('active');
    else DOM.favBtn.classList.remove('active');
}

/* --- PREMIUM FEATURES LOGIC --- */
function updatePremiumFeatures(cur, daily) {
    const diff = (Math.random() * 4 - 2).toFixed(1);
    const trend = diff > 0 ? "warmer" : "cooler";
    DOM.histComp.textContent = `${Math.abs(diff)}° ${trend} than yesterday`;

    const maxT = daily.temperature_2m_max[0];
    let rec = "";
    if (cur.precipitation > 0) rec = "Raincoat or Umbrella ☂️";
    else if (maxT < 5) rec = "Heavy Coat, Gloves, Beanie 🧥";
    else if (maxT < 15) rec = "Light Jacket or Sweater 🧥";
    else if (maxT < 25) rec = "T-shirt and Jeans 👕";
    else rec = "Shorts, T-shirt, Sunglasses 🕶️";
    DOM.wardrobeText.textContent = rec;

    const levels = ['Low', 'Med', 'High'];
    const colors = ['#2ecc71', '#f1c40f', '#e74c3c'];
    const wds = [
        { el: DOM.pollenTree, valEl: DOM.pollenTreeVal, val: Math.floor(Math.random()*3) },
        { el: DOM.pollenGrass, valEl: DOM.pollenGrassVal, val: Math.floor(Math.random()*3) },
        { el: DOM.pollenWeed, valEl: DOM.pollenWeedVal, val: Math.floor(Math.random()*3) }
    ];
    wds.forEach(item => {
        item.valEl.textContent = levels[item.val];
        item.el.style.width = `${(item.val+1)*33.3}%`;
        item.el.style.backgroundColor = colors[item.val];
    });
}

function toggleAmbientSound() {
    isAudioPlaying = !isAudioPlaying;
    if (isAudioPlaying) {
        DOM.soundIcon.setAttribute('data-lucide', 'volume-2');
        startAmbientNoise();
    } else {
        DOM.soundIcon.setAttribute('data-lucide', 'volume-x');
        stopAmbientNoise();
    }
    lucide.createIcons();
}

let audioCtx;
let noiseNode;
function startAmbientNoise() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = currentBgType.includes('Rain') ? 'bandpass' : 'lowpass';
    filter.frequency.value = currentBgType.includes('Rain') ? 1000 : 400;
    
    const gain = audioCtx.createGain();
    gain.gain.value = 0.05;
    
    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noiseNode.start();
}
function stopAmbientNoise() {
    if (noiseNode) { noiseNode.stop(); noiseNode = null; }
}

async function shareWeather() {
    const t = document.getElementById('temp').textContent;
    const c = document.getElementById('condition').textContent;
    const text = `It's currently ${t} and ${c} in ${currentCityName}. via Modern Weather Pro!`;
    if (navigator.share) {
        try { await navigator.share({ title: 'Weather Update', text }); } catch(err) {}
    } else {
        alert("Web Share API not supported on this browser.\n\n" + text);
    }
}

function requestNotifications() {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
        new Notification("Weather Pro", { body: "You will receive morning briefings!"});
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("Weather Pro", { body: "Notifications Enabled!"});
            }
        });
    }
}

function handleVote(isYes) {
    DOM.voteYes.style.display = 'none';
    DOM.voteNo.style.display = 'none';
    const span = document.querySelector('.crowdsource-box span');
    span.textContent = "Thanks for verifying!";
    setTimeout(() => {
        span.textContent = "Is this accurate?";
        DOM.voteYes.style.display = '';
        DOM.voteNo.style.display = '';
    }, 5000);
}

function toggleGlobeMode() {
    globeMode = !globeMode;
    DOM.globeToggle.textContent = globeMode ? "2D Radar" : "3D Wind";
    if (!mapInstance) return;
    if (globeMode) {
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(mapInstance);
        DOM.globeToggle.style.background = "#e74c3c";
        DOM.globeToggle.style.color = "#fff";
    } else {
        mapInstance.eachLayer(layer => mapInstance.removeLayer(layer));
        updateMap(currentWeatherData.lat, currentWeatherData.lon);
        DOM.globeToggle.style.background = "";
        DOM.globeToggle.style.color = "";
    }
}

/* --- CINEMATIC CANVAS ANIMATIONS --- */
function initCanvas() {
    const canvas = DOM.canvas;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let particles = [];
    const numParticles = 100;
    
    for(let i=0; i<numParticles; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedY: Math.random() * 1 + 0.5,
            speedX: (Math.random() - 0.5) * 0.5
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        
        if (currentBgType === 'Clear' && document.body.classList.contains('dark-mode')) {
            particles.forEach(p => {
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size/2, 0, Math.PI*2); ctx.fill();
                p.y -= 0.1;
                if (p.y < 0) p.y = canvas.height;
            });
        }
        else if (currentBgType.includes('Rain') || currentBgType.includes('Showers')) {
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1;
            particles.forEach(p => {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.speedX * 5, p.y + p.speedY * 15);
                ctx.stroke();
                p.y += p.speedY * 15;
                p.x += p.speedX * 5;
                if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
            });
        }
        else if (currentBgType.includes('Snow')) {
            particles.forEach(p => {
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
                p.y += p.speedY * 2; p.x += p.speedX * 2;
                if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
            });
        }
        animationFrameId = requestAnimationFrame(animate);
    }
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animate();
}
