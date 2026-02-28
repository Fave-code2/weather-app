let isMetric = true; // default metric
let weatherDataGlobal = null;

const unitDropDown = document.getElementById('units-toggle');
const unitToggle = document.getElementById('switch-preset');

const displayUnits = document.getElementById('unit-display');
const days = document.querySelector('#days');
const displayDays = document.getElementById('display-days');
const dayButtons = document.querySelectorAll('#display-days button');

const errorBox = document.querySelector('#error-message');
const mainMessage = document.getElementById('main');
const loading = document.getElementById('loading');
const form = document.querySelector('#search-form');
const input = document.querySelector('#search-input');

// Loading state
function showLoading() {
  loading.classList.remove('hidden');
  mainMessage.classList.add('hidden');
}
function hideLoading(showMain = true) {
  loading.classList.add('hidden');
  if (showMain) mainMessage.classList.remove('hidden');
}

// Fetch weather from Open-Meteo
const fetchWeatherByCity = async (city) => {
  const geoResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
  );
  const geoData = await geoResponse.json();
  if (!geoData.results || geoData.results.length === 0)
    throw new Error('City not found');

  const { latitude, longitude, name, country } = geoData.results[0];

  const temperatureUnit = isMetric ? 'celsius' : 'fahrenheit';
  const windspeedUnit = isMetric ? 'ms' : 'mph';
  const precipitationUnit = isMetric ? 'mm' : 'inch';

  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=temperature_2m_max,weathercode,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max&temperature_unit=${temperatureUnit}&windspeed_unit=${windspeedUnit}&precipitation_unit=${precipitationUnit}`,
  );
  const weatherData = await weatherResponse.json();

  return { location: `${name}, ${country}`, weather: weatherData };
};

// Search form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = input.value.trim();
  if (!city) return;

  errorBox.innerHTML = '';
  mainMessage.classList.remove('hidden');

  try {
    showLoading();
    const data = await fetchWeatherByCity(city);
    weatherDataGlobal = data;
    console.log(data);

    renderCurrentTemp(data);
    humWindPrecitFeel(data);
    dailyData(data);
    hourlyData(data, data.weather.daily.time[0]); // default first day
    hideLoading(true);
  } catch (error) {
    errorBox.innerHTML = `<p class="font-bold text-center text-xl sm:text-2xl mt-5 h-65">No result was found</p>`;
    hideLoading(false);
  }

  input.value = '';
});

// Toggle metric / imperial
unitToggle.addEventListener('click', async () => {
  isMetric = !isMetric;
  unitToggle.textContent = isMetric ? 'Switch to Imperial' : 'Switch to Metric';

  // const fahrenheit = document.querySelectorAll('.fahrenheit');
  // const celsius = document.querySelectorAll('.celsius');

  // if (unitToggle.textContent === 'Switch to Metric') {
  //   celsius.classList.remove('hidden');
  //   fahrenheit.classList.add('hidden');
  // } else {
  //   celsius.classList.add('hidden');
  //   fahrenheit.classList.remove('hidden');
  // }

  if (!weatherDataGlobal) return;

  const cityName = weatherDataGlobal.location.split(',')[0];
  showLoading();
  const data = await fetchWeatherByCity(cityName);
  weatherDataGlobal = data;

  renderCurrentTemp(data);
  humWindPrecitFeel(data);
  dailyData(data);
  hourlyData(data, data.weather.daily.time[0]);
  hideLoading(true);
});

// Render current temperature
const renderCurrentTemp = (place) => {
  const currentTemp = place.weather.current_weather.temperature;
  const location = place.location;
  const mainTempElement = document.querySelector('#main-weather-temp');

  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const month = now.toLocaleDateString('en-US', { month: 'short' });
  const date = now.getDate();
  const year = now.getFullYear();

  days.textContent = dayName;

  mainTempElement.innerHTML = `
    <div class="text-center md:text-start">
      <h2 class="text-xl mb-2">${location}</h2>
      <p class="text-neutral-300">${dayName}, ${month} ${date}, ${year}</p>
    </div>
    <div class="flex items-center justify-between sm:justify-center lg:gap-x-15">
      <img class="w-30 h-30" src="./assets/images/icon-sunny.webp" alt="" />
      <h2 class="text-7xl font-bold">${currentTemp.toFixed()}°</h2>
    </div>
  `;
};

// Render humidity, wind, precipitation, feels like
const humWindPrecitFeel = (data) => {
  const feelLike = document.getElementById('feels-like');
  const wind = document.getElementById('wind');
  const humidity = document.getElementById('humidity');
  const precipt = document.getElementById('precipt');

  const windUnit = isMetric ? 'km/s' : 'mph';
  const precUnit = isMetric ? 'mm' : 'in';

  feelLike.textContent = `${data.weather.hourly.apparent_temperature[0].toFixed()}°`;
  wind.textContent = `${Math.floor(data.weather.current_weather.windspeed)} ${windUnit}`;
  humidity.textContent = `${data.weather.hourly.relative_humidity_2m[0]}%`;
  precipt.textContent = `${data.weather.hourly.precipitation[0]} ${precUnit}`;
};

// Render daily forecast
const dailyData = (data) => {
  const dailyForcast = document.getElementById('daily-data');
  const daily = data.weather.daily;
  dailyForcast.innerHTML = '';

  daily.time.forEach((day, index) => {
    const max = daily.temperature_2m_max[index];
    const min = daily.temperature_2m_min[index];
    const code = daily.weathercode[index];

    const icon = `icon-${getWeatherCodeName(code)}.webp`;

    const formatDayShort = new Date(day).toLocaleDateString([], {
      weekday: 'short',
    });
    const particularDay = document.createElement('div');
    particularDay.classList.add(
      'bg-neutral-800',
      'px-3',
      'py-4',
      'rounded-lg',
      'text-center',
    );
    particularDay.innerHTML = `
      <p>${formatDayShort}</p>
      <img class="w-10 mx-auto" src="./assets/images/${icon}" alt="weather icon" />
      <div class="flex items-center justify-between">
        <p>${Math.round(max)}°</p>
        <p>${Math.round(min)}°</p>
      </div>
    `;
    dailyForcast.appendChild(particularDay);
  });
};

// Render hourly data
const hourlyData = (data, selectedDate) => {
  const hourlyForcast = document.getElementById('hourly-data');
  if (!hourlyForcast) return;
  hourlyForcast.innerHTML = '';

  const hourly = data.weather.hourly;
  const filterDate = new Date(selectedDate);

  const times = hourly.time.filter((timeStr) => {
    const date = new Date(timeStr);
    return (
      date.getFullYear() === filterDate.getFullYear() &&
      date.getMonth() === filterDate.getMonth() &&
      date.getDate() === filterDate.getDate()
    );
  });

  times.forEach((timeStr) => {
    const index = hourly.time.indexOf(timeStr);
    const temp = hourly.temperature_2m[index];
    const code = hourly.weathercode[index];
    const icon = `icon-${getWeatherCodeName(code)}.webp`;

    const dateObj = new Date(timeStr);
    const hour24 = dateObj.getHours();
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    const displayHour = `${hour12}${ampm}`;

    const exactHour = document.createElement('div');
    exactHour.classList.add(
      'bg-neutral-700',
      'flex',
      'items-center',
      'justify-between',
      'mt-2',
      'rounded-md',
      'px-2',
    );
    exactHour.innerHTML = `
      <div class="flex items-center gap-2">
        <img class="w-12" src="./assets/images/${icon}" />
        <p>${displayHour}</p>
      </div>
      <p>${Math.round(temp)}°</p>
    `;
    hourlyForcast.appendChild(exactHour);
  });
};

// Map weather codes to icons
function getWeatherCodeName(code) {
  const weatherCodes = {
    0: 'sunny',
    1: 'partly-cloudy',
    2: 'partly-cloudy',
    3: 'overcast',
    45: 'fog',
    48: 'fog',
    51: 'drizzle',
    53: 'drizzle',
    55: 'drizzle',
    56: 'drizzle',
    57: 'drizzle',
    61: 'rain',
    63: 'rain',
    65: 'rain',
    66: 'rain',
    67: 'rain',
    71: 'snow',
    73: 'snow',
    75: 'snow',
    77: 'snow',
    80: 'rain',
    81: 'rain',
    82: 'rain',
    85: 'snow',
    86: 'snow',
    95: 'storm',
    96: 'storm',
    99: 'storm',
  };
  return weatherCodes[code];
}

// Day buttons click
dayButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!weatherDataGlobal) return;

    dayButtons.forEach((b) => b.classList.remove('bg-neutral-700'));
    btn.classList.add('bg-neutral-700');

    const selectedDayName = btn.textContent.trim();
    const forecastDates = weatherDataGlobal.weather.daily.time;
    const matchedDate = forecastDates.find((d) => {
      const dayName = new Date(d).toLocaleDateString('en-US', {
        weekday: 'long',
      });
      return dayName === selectedDayName;
    });

    days.textContent = btn.textContent;

    if (!matchedDate) return;
    hourlyData(weatherDataGlobal, matchedDate);
    displayDays.classList.add('hidden');
  });
});

// Dropdown toggle
function dropDown() {
  unitDropDown.addEventListener('click', () =>
    displayUnits.classList.toggle('hidden'),
  );
  days.addEventListener('click', () => displayDays.classList.toggle('hidden'));
}
document.addEventListener('DOMContentLoaded', dropDown);
