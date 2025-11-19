// Same loadWeather() function as before but with upgrades
async function loadWeather(lat, lon, cityName = null) {
  document.getElementById("location").textContent = cityName || "Loading…";
  document.getElementById("location").setAttribute("data-text", cityName || "Loading…");

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

  // Big reveal
  const answerEl = document.getElementById("answer");
  answerEl.textContent = willSnow ? "YES" : "NO";
  answerEl.className = "answer reveal active " + (willSnow ? "yes" : "no");

  document.getElementById("timer").textContent = willSnow && firstFlakeHours !== null ? `First flake in ${firstFlakeHours}h` : "";
  document.getElementById("streak").textContent = willSnow ? "" : `${streak}-day snow-free streak`;
  document.getElementById("confidence").textContent = confidence;

  // Forecast
  document.getElementById("forecast").innerHTML = days.map(day => {
    const d = new Date(day.date).toLocaleDateString("en-US", {weekday:"short", month:"short", day:"numeric"});
    return day.snow_cm > 0.5
      ? `<div class="day glass"><h4>${d}</h4><div class="snow">${day.snow_cm.toFixed(1)} cm</div><div class="prob">${day.prob}%</div></div>`
      : `<div class="day glass"><h4>${d}</h4><div class="snow">No snow</div></div>`;
  }).join("");

  // Smart particles + confetti if big snow
  if (days.slice(0,3).some(d => d.snow_cm > 5)) {
    tsParticles.load("particles-js", { preset: "snow", particles: { number: { value: 150 }, move: { speed: 4 } }, fullScreen: { zIndex: -1 } });
    setTimeout(() => confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } }), 1000);
  } else if (willSnow) {
    tsParticles.load("particles-js", { preset: "snow", particles: { number: { value: 80 } }, fullScreen: { zIndex: -1 } });
  }

  // Reveal everything
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
}

// Same init(), searchCity(), shareForecast() as before — just paste them here
async function init() {
  const ip = await fetch("https://ipwho.is/").then(r => r.json());
  document.getElementById("location").setAttribute("data-text", `${ip.city}, ${ip.country}`);
  loadWeather(ip.latitude, ip.longitude, `${ip.city}, ${ip.country}`);
}

async function searchCity() { /* same as before */ }
function shareForecast() { /* same as before */ }

init();