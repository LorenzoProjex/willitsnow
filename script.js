const API_KEY = prompt("16306282645d4f5ea45133649251911"); // you only do this once
const CITY = "Preston,UK";

const quotes = [
  "Dress for the slide, not the ride.",
  "If in doubt, throttle out.",
  "Snow means go.",
  "Cold hands, warm heart, can't lose.",
  "The GS laughs at winter."
];

async function getWeather() {
  try {
    const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${CITY}&days=1&aqi=no&alerts=no`);
    const data = await res.json();

    const temp = Math.round(data.current.temp_c);
    const feels = Math.round(data.current.feelslike_c);
    const condition = data.current.condition.text.toLowerCase();
    const windKph = data.current.wind_kph;

    document.getElementById("temp").textContent = temp;
    document.getElementById("feels").textContent = feels;
    document.getElementById("condition").textContent = data.current.condition.text;
    document.getElementById("wind").textContent = windKph;

    // Snow logic
    const answer = document.getElementById("answer");
    answer.classList.remove("loading");

    if (condition.includes("snow") || condition.includes("blizzard") || condition.includes("sleet")) {
      answer.textContent = "YES";
      answer.classList.add("yes");
    } else if (temp <= 2 && (condition.includes("rain") || condition.includes("drizzle"))) {
      answer.textContent = "MAYBE (possible sleet)";
      answer.classList.add("maybe");
    } else {
      answer.textContent = "NO";
      answer.classList.add("no");
    }

    // Rideable rating
    let ride = "YES";
    if (temp < -3 || windKph > 50 || condition.includes("ice")) ride = "ONLY IF YOU'RE MAD";
    else if (temp < 1 || condition.includes("sleet")) ride = "PROBABLY NOT";
    document.getElementById("rideable").innerHTML = ride;

    // Random quote
    document.getElementById("quote").textContent = quotes[Math.floor(Math.random() * quotes.length)];

  } catch (e) {
    document.getElementById("answer").textContent = "API error – check key";
  }
}

getWeather();