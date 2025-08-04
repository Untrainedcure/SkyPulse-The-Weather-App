const apiKey = 'a068f24f31237d4da32e55be2fab7c62';

const iconMap = {
  "Clear": "wi-day-sunny",
  "Clouds": "wi-cloudy",
  "Rain": "wi-rain",
  "Drizzle": "wi-sprinkle",
  "Thunderstorm": "wi-thunderstorm",
  "Snow": "wi-snow",
  "Mist": "wi-fog"
};



function updateBackground(weather) {
  const bgMap = {
    "Clear": "url('clear.jpg')",
    "Clouds": "url('clouds.jpg')",
    "Rain": "url('rain.jpg')",
    "Drizzle": "url('drizzle.jpg')",
    "Thunderstorm": "url('thunder.jpg')",
    "Snow": "url('snow.jpg')",
    "Mist": "url('mist.jpg')",
    "Default": "url('default.jpg')"
  };

  document.body.style.backgroundImage = bgMap[weather] || bgMap["Default"];
}


function showLoader(show) {
  document.getElementById("loader").style.display = show ? "block" : "none";
}

function showCaption(message) {
  const caption = document.getElementById('captionBox');
  caption.innerText = message;
  caption.style.opacity = 1;
  setTimeout(() => {
    caption.style.opacity = 0;
  }, 3000);
}

function updateFavorites(city) {
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  if (!favorites.includes(city)) {
    favorites.push(city);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
  }
}

function renderFavorites() {
  const list = document.getElementById('favoriteList');
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  list.innerHTML = favorites.map(city => `
    <span class="fav-item">
      <button onclick="getWeather('${city}')">${city}</button>
      <button class="remove-btn" onclick="removeFavorite('${city}')" title="Remove ${city}">❌</button>
    </span>
  `).join('');
}

function removeFavorite(city) {
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  favorites = favorites.filter(c => c !== city);
  localStorage.setItem('favorites', JSON.stringify(favorites));
  renderFavorites();
  showCaption(`${city} removed from favorites ❌`);
}

renderFavorites();

function goHome() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.getElementById('weatherInfo').style.display = 'none';
  document.getElementById('forecast').style.display = 'none';
  document.getElementById('alerts').style.display = 'none';
  document.getElementById('aqiPanel').style.display = 'none';
  document.getElementById('windyEmbed').style.display = 'block';
  document.getElementById('cityInput').value = '';
  document.body.style.backgroundImage = "url('default.jpg')";
  showCaption("Back to start! 🌐");
}

async function getWeather(cityParam) {
  const city = cityParam || document.getElementById('cityInput').value;
  if (!city) return;

  showLoader(true);

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

  console.log(`Fetching weather for: ${city}`);
  console.log("Weather API URL:", url);

  try {
    const [res, forecastRes] = await Promise.all([fetch(url), fetch(forecastUrl)]);
    const data = await res.json();

    if (!data || data.cod != 200) {
      showCaption("⚠️ API Error: " + (data.message || "Unknown issue"));
      console.error("Weather API Response:", data);
      return;
    }

    document.getElementById('weatherInfo').style.display = 'block';
    document.getElementById('forecast').style.display = 'grid';
    document.getElementById('alerts').style.display = 'none';
    document.getElementById('aqiPanel').style.display = 'none';
    document.getElementById('windyEmbed').style.display = 'block';

    const forecastData = await forecastRes.json();

    document.getElementById('location').innerText = `${data.name}, ${data.sys.country}`;
    document.getElementById('temperature').innerText = `Temperature: ${data.main.temp}°C`;
    document.getElementById('description').innerText = `Condition: ${data.weather[0].description}`;
    document.getElementById('humidity').innerText = `Humidity: ${data.main.humidity}%`;
    document.getElementById('wind').innerText = `Wind Speed: ${data.wind.speed} m/s`;

    const mainWeather = data.weather[0].main;
    const iconClass = iconMap[mainWeather] || "wi-na";
    document.getElementById('weatherIcon').className = `wi ${iconClass}`;

    updateBackground(mainWeather);
    updateFavorites(data.name);
    showCaption(`Here's the weather in ${data.name} 🌈`);

    const radarMap = document.getElementById('radarMap');
    radarMap.src = `https://embed.windy.com/embed2.html?lat=${data.coord.lat}&lon=${data.coord.lon}&detailLat=${data.coord.lat}&detailLon=${data.coord.lon}&width=650&height=450&zoom=6&type=radar`;

    const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${data.coord.lat}&lon=${data.coord.lon}&appid=${apiKey}`;
    const aqiRes = await fetch(aqiUrl);
    const aqiData = await aqiRes.json();
    const aqi = aqiData.list[0].main.aqi;

    const aqiLevels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
    const tips = [
      "Enjoy your day! 🌿",
      "Air is okay, but sensitive people should stay aware.",
      "Consider limiting prolonged outdoor activity.",
      "Avoid outdoor exertion. Wear a mask if needed.",
      "Stay indoors and keep windows closed. 🏠"
    ];

    document.getElementById('aqiPanel').style.display = 'block';
    document.getElementById('aqiValue').innerText = `AQI: ${aqi} (${aqiLevels[aqi - 1]})`;
    document.getElementById('aqiTips').innerText = tips[aqi - 1];

    const forecastElement = document.getElementById('forecast');
    forecastElement.innerHTML = '';
    const uniqueDays = {};
    forecastData.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!uniqueDays[date] && Object.keys(uniqueDays).length < 5) {
        uniqueDays[date] = item;
        const div = document.createElement('div');
        div.className = 'forecast-day';
        div.innerHTML = `
          <h4>${new Date(date).toDateString()}</h4>
          <p>${item.weather[0].description}</p>
          <p>Temp: ${item.main.temp}°C</p>
        `;
        forecastElement.appendChild(div);
      }
    });

    document.getElementById('alerts').style.display = 'none';

  } catch (err) {
    showCaption("❌ Couldn't fetch data. Check your internet or try again.");
    console.error("API Fetch Error:", err);
    document.getElementById('weatherInfo').style.display = 'none';
    document.getElementById('forecast').style.display = 'none';
    document.getElementById('alerts').style.display = 'none';
    document.getElementById('aqiPanel').style.display = 'none';
    document.getElementById('windyEmbed').style.display = 'block';
  } finally {
    showLoader(false);
  }
}

function startVoiceSearch() {
  if (!('webkitSpeechRecognition' in window)) {
    alert('Speech recognition not supported.');
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.start();
  showCaption("🎙️ Listening for city name...");

  recognition.onresult = (event) => {
    const city = event.results[0][0].transcript;
    document.getElementById('cityInput').value = city;
    getWeather(city);
  };
}
async function getWeatherByLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    try {
      showLoader(true);
      const [res, forecastRes] = await Promise.all([fetch(url), fetch(forecastUrl)]);
      const data = await res.json();
      const forecastData = await forecastRes.json();

      if (data.cod !== 200) throw new Error("Location data error");

      document.getElementById('cityInput').value = data.name;
      getWeather(data.name);
    } catch (err) {
      showCaption("❌ Unable to get your location's weather.");
      console.error(err);
    } finally {
      showLoader(false);
    }
  }, () => {
    alert("Unable to retrieve your location.");
  });
}
