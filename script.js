async function init() {
  // 1. Get location from IP
  const ip = await fetch("https://ipwho.is/").then(r => r.json());
  const lat = ip.latitude;
  const lon = ip.longitude;
  document.getElementById("location").textContent = `${ip.city}, ${ip.country}`;

  // 2. Get weather (Open-Meteo – free forever)
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=snowfall_sum,precipitation_probability_max,weathercode&timezone=auto&forecast_days=7`;
  const w = await fetch(url).then(r => r.json());

  const days = w.daily.time.map((date, i) => ({
    date,
    snow_cm: w.daily.snowfall_sum[i],
    prob: w.daily.precipitation_probability_max[i]
  }));

  // Calculations
  let streak = 0;
  let firstFlakeHours = null;
  let highestProb = 0;
  let highestSnow = 0;

  days.forEach((day, i) => {
    const diff = (new Date(day.date) - new Date().setHours(0,0,0,0)) / 3600000;
    if (day.snow_cm > 0.5) {
      if (firstFlakeHours === null) firstFlakeHours = Math.max(0, Math.round(diff));
      highestSnow = Math.max(highestSnow, day.snow_cm);
    } else {
      if (firstFlakeHours === null) streak++;
    }
    highestProb = Math.max(highestProb, day.prob);
  });

  const confidence = Math.min(100, Math.round(highestProb * 0.7 + highestSnow * 12));

  // Render hero
  const willSnow = days.some(d => d.snow_cm > 0.5);
  document.getElementById("answer").textContent = willSnow ? "YES" : "NO";
  document.getElementById("answer").className = "big " + (willSnow ? "yes" : "no");

  if (willSnow && firstFlakeHours !== null) {
    document.getElementById("timer").textContent = `First flake in ${firstFlakeHours}h`;
  } else {
    document.getElementById("timer").textContent = "";
  }

  document.getElementById("streak").textContent = willSnow ? "" : `${streak}-day snow-free streak 🔥`;
  document.getElementById("confidence").textContent = confidence;

  // 7-day cards
  const forecastEl = document.getElementById("forecast");
  forecastEl.innerHTML = days.map(day => {
    const d = new Date(day.date).toLocaleDateString("en-US", {weekday:"short", month:"short", day:"numeric"});
    if (day.snow_cm > 0.5) {
      return `<div class="day"><h4>${d}</h4><div class="snow">${day.snow_cm.toFixed(1)} cm</div><div class="prob">${day.prob}% chance</div></div>`;
    } else {
      return `<div class="day"><h4>${d}</h4><div class="snow">No snow</div></div>`;
    }
  }).join("");

  // Snow particles when snow is coming in next 3 days
  if (days.slice(0,3).some(d => d.snow_cm > 0.5)) {
    tsParticles.load("particles-js", {
      preset: "snow",
      particles: { number: { value: 80 }, opacity: { value: 0.6 }, size: { value: { min: 1, max: 5 } } },
      fullScreen: { enable: true, zIndex: -1 }
    });
  }
}

init();