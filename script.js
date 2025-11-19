async function loadWeather(lat, lon, cityName = null) {
  document.getElementById("location").textContent = cityName || "Loading…";

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=snowfall_sum,precipitation_probability_max&timezone=auto&forecast_days=7`;
  const w = await fetch(url).then(r => r.json());

  const days = w.daily.time.map((date, i) => ({
    date,
    snow_cm: w.daily.snowfall_sum[i] || 0,
    prob: w.daily.precipitation_probability_max[i] || 0
  }));

  let streak = 0;
  let firstFlakeHours = null;
  let highestProb = 0;
  let highestSnow = 0;

  days.forEach((day, i) => {
    const diff = (new Date(day.date) - new Date().setHours(0,0,0,0)) / 3600000;
    if (day.snow_cm > 0.5) {
      if (firstFlakeHours === null) firstFlakeHours = Math.max(0, Math.round(diff));
      highestSnow = Math.max(highestSnow, day.snow_cm);
    } else if (firstFlakeHours === null) streak++;
    highestProb = Math.max(highestProb, day.prob);
  });

  const confidence = Math.min(100, Math.round(highestProb * 0.7 + highestSnow * 12));
  const willSnow = days.some(d => d.snow_cm > 0.5);

  // Render
  const answerEl = document.getElementById("answer");
  answerEl.textContent = willSnow ? "YES" : "NO";
  answerEl.className = willSnow ? "yes" : "no";

  document.getElementById("timer").textContent = willSnow && firstFlakeHours !== null ? `First flake in ${firstFlakeHours}h` : "";
  document.getElementById("streak").textContent = willSnow ? "" : `${streak}-day snow-free streak`;
  document.getElementById("confidence").textContent = confidence;

  // Forecast cards
  document.getElementById("forecast").innerHTML = days.map(day => {
    const d = new Date(day.date).toLocaleDateString("en-US", {weekday:"short", month:"short", day:"numeric"});
    return day.snow_cm > 0.5
      ? `<div class="day"><h4>${d}</h4><div class="snow">${day.snow_cm.toFixed(1)} cm</div><div class="prob">${day.prob}%</div></div>`
      : `<div class="day"><h4>${d}</h4><div class="snow">No snow</div></div>`;
  }).join("");

  // Snow particles when snow is coming soon
  if (days.slice(0,3).some(d => d.snow_cm > 0.5)) {
    tsParticles.load("particles-js", {
      preset: "snow",
      particles: { number: { value: 90 }, opacity: { value: 0.6 }, size: { value: { min: 1, max: 5 } } },
      fullScreen: { zIndex: -1 }
    });
  }
}

// Initial load via IP
async function init() {
  const ip = await fetch("https://ipwho.is/").then(r => r.json());
  document.getElementById("location").textContent = `${ip.city}, ${ip.country}`;
  loadWeather(ip.latitude, ip.longitude, `${ip.city}, ${ip.country}`);
}

// Manual city search
async function searchCity() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) return;
  const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`).then(r => r.json());
  if (geo.results && geo.results[0]) {
    const { latitude, longitude, name, country } = geo.results[0];
    loadWeather(latitude, longitude, `${name}, ${country}`);
  } else {
    alert("City not found – try again");
  }
}

// Viral share
function shareForecast() {
  const text = document.getElementById("answer").textContent === "YES"
    ? `YES – Snow coming to ${document.getElementById("location").textContent}! ${document.getElementById("timer").textContent || "Soon"}`
    : `NO snow for ${document.getElementById("location").textContent} – ${document.getElementById("streak").textContent || "safe"}`;
  if (navigator.share) {
    navigator.share({ title: "Will It Snow?", text, url: location.href });
  } else {
    navigator.clipboard.writeText(text + " ➜ " + location.href);
    alert("Copied to clipboard – paste anywhere!");
  }
}

// Start
init();