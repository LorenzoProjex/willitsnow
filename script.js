// Cursor snowflake
document.addEventListener('mousemove', e => {
  const cursor = document.getElementById('cursor');
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});
document.querySelectorAll('a, button, input').forEach(el => {
  el.addEventListener('mouseenter', () => document.getElementById('cursor').classList.add('snowflake'));
  el.addEventListener('mouseleave', () => document.getElementById('cursor').classList.remove('snowflake'));
});

// Rest of the weather code (same logic, just prettier output)
async function loadWeather(lat, lon, name) {
  document.getElementById("location").textContent = name;

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=snowfall_sum,precipitation_probability_max&timezone=auto&forecast_days=7`);
  const w = await res.json();

  const days = w.daily.time.map((d,i) => ({
    date: d,
    snow: w.daily.snowfall_sum[i] || 0,
    prob: w.daily.precipitation_probability_max[i] || 0
  }));

  const willSnow = days.some(d => d.snow > 0.5);
  const bigSnow = days.some(d => d.snow > 8);
  const confidence = Math.min(100, Math.round(days.reduce((a,b)=>Math.max(a,b.prob),0) * 0.7 + days.reduce((a,b)=>Math.max(a,b.snow),0) * 8));

  // Answer
  const answer = document.getElementById("answer");
  answer.textContent = willSnow ? "YES" : "NO";
  answer.className = willSnow ? "answer-text yes" : "answer-text";

  // Timer / streak
  const first = days.findIndex(d => d.snow > 0.5);
  document.getElementById("timer").textContent = willSnow ? `First flakes in ~${first===0?"today":first+" days"}` : "";
  document.getElementById("streak").textContent = willSnow ? "" : `${days.slice(0,first===-1?7:first).length}-day snow-free streak`;

  // Confidence bar
  document.getElementById("confidence").textContent = confidence;
  document.getElementById("bar-fill").style.width = confidence + "%";

  // Forecast orbs
  document.getElementById("forecast").innerHTML = days.map(day => {
    const date = new Date(day.date).toLocaleDateString("en-US", {weekday:"short", month:"short", day:"numeric"});
    return `<div class="card" data-tilt><div>${date}</div><div class="snow">${day.snow>0.5?day.snow.toFixed(1)+"cm":"—"}</div><small>${day.prob}%</small></div>`;
  }).join("");

  // Particles
  if (bigSnow) {
    tsParticles.load("particles", { preset:"snow", particles:{number:{value:200}, move:{speed:6}} });
  } else if (willSnow) {
    tsParticles.load("particles", { preset:"snow", particles:{number:{value:80}} });
  }
}

// Init + search same as before (IP → loadWeather)
async function init() {
  const ip = await fetch("https://ipwho.is/").then(r=>r.json());
  loadWeather(ip.latitude, ip.longitude, `${ip.city}, ${ip.country}`);
}
async function searchCity() {
  const q = document.getElementById("cityInput").value;
  const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1`).then(r=>r.json());
  if (geo.results?.[0]) {
    const r = geo.results[0];
    loadWeather(r.latitude, r.longitude, `${r.name}, ${r.country}`);
  }
}
function shareForecast() { navigator.clipboard.writeText(location.href); alert("Link copied!"); }

init();