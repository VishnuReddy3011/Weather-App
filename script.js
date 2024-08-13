const weatherIconsMap = new Map([
  ['clear', './images/clear.png'],
  ['clouds', './images/clouds.png'],
  ['drizzle', './images/drizzle.png'],
  ['haze', './images/haze.png'],
  ['humidity', './images/humidity.png'],
  ['mist', './images/mist.png'],
  ['rain', './images/rain.png'],
  ['snow', './images/snow.png'],
  ['wind', './images/wind.png'],
  ['thunderstorm', './images/thunderstorms.png'],
]);
import { kmp } from './kmp.js' 
import db from './db.json' with { type: "json" };
const newData = db.cities;

const cache = new Map();
let idx = -1, canPopulate = true;

// API TO BE USED FOR THE WEATHER DETAILS
const apiKey = '46d47581a51a79782741111953e700af';
const apiUrl = 'https://api.openweathermap.org/data/2.5/weather?units=metric&q=';

const select = str => document.querySelector(str);

const searchBox = select('.search input');
const searchBtn = select('.search button');
const weatherIcon = select('.weather-icon');
const box = select(".suggestBox");
const noResult = select(".error");

function formatTime(originalTime) {
  // Parse the original time string
  const timeParts = originalTime.split(' ');
  const time = timeParts[0].split(':');
  const period = timeParts[1];

  // Extract hours and minutes
  let hours = parseInt(time[0], 10);
  const minutes = time[1];

  // Format the hours: add leading zero only if hours < 10
  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;

  // Return the formatted time
  return `${formattedHours}:${minutes} ${period}`;
}

function formatDate(date) {
  // Array of full weekday names
  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
    'Thursday', 'Friday', 'Saturday'
  ];

  // Array of full month names
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Extract the day of the week, month, and date
  const dayOfWeek = daysOfWeek[date.getDay()];
  const month = months[date.getMonth()];
  const dayOfMonth = date.getDate();

  // Return the formatted date string
  return `${dayOfWeek} ${month} ${dayOfMonth}`;
}

function getTimeInfo(offset) {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;

  // Calculate the time for the desired offset
  const offsetTime = new Date(utcTime + offset * 1000);
  const first =  formatTime(offsetTime.toLocaleTimeString());
  const second = formatDate(offsetTime);
  return [first, second];
}
const getString = str => {
  const arr = str.split(" ");
  if(arr[arr.length-1].length != 2) {
    return str;
  }
  let x = arr[arr.length-1].charCodeAt(0);
  let y = arr[arr.length-1].charCodeAt(1);
  if(x >= 65 && x <= 90 && y >= 65 && y <= 90) {
    const arr = str.split(" ");
    let n = arr.length;
    let req = "";
    for(let i = 0; i < n-2; i++) {
        req += arr[i] + " ";
    }
    req += arr[n-2] + "," + arr[n-1];
    return req;
  }
  return str;
}
async function checkWeather(cityStr) {
  if(!cityStr) return;

  const city = getString(cityStr);
  
  const response = await fetch(apiUrl + city + `&appid=${apiKey}`); //to fetch the details when city name is entered.

  if (response.status == 404) {
    noResult.style.display = 'flex';
    select('.weather').style.display = 'none';
  } 
  else {
    let data = await response.json();
    select('.city').textContent = data.name;
    select('.temp').textContent = Math.round(data.main.temp) + '°C';
    select('.humidity').textContent = data.main.humidity + '%';
    select('.wind').textContent = data.wind.speed + 'km/h';
    const [first, second] = getTimeInfo(data?.timezone);
    select('#time').textContent = first
    select('#date').textContent = second;

    weatherIcon.src = weatherIconsMap.get(data.weather[0]?.main?.toLowerCase());
    select('.weather').style.display = 'flex';
    noResult.style.display = 'none';
  }
  box.classList.remove("active");
}


searchBtn.addEventListener('click', () => {
  // when search button is clicked it initiates the check weather program with the city name entered
  checkWeather(searchBox.value);
});

select('form').addEventListener('submit', (e) => {
  e.preventDefault();
  if(box.classList.contains("active")) {
    checkWeather(searchBox.value);
  }
  box.classList.remove("active");
});


searchBox.addEventListener("keydown", e => {
  if(box.children.length === 0) {
    return;
  }
  if(e.keyCode === 40) { // down
    canPopulate = false;
    idx = (idx+1)%(box.children.length);
    box.children[(idx-1+box.children.length)%(box.children.length)].classList.remove("gray");

    box.children[idx].classList.add("gray");
    box.children[idx].scrollIntoView({ block: "nearest", behavior: "instant" });
    searchBox.value = box.children[idx].textContent;
  }
  else if(e.keyCode === 38) { // up
    canPopulate = false;
    e.preventDefault();
    if(idx < 0) {
      return;
    }
    if(idx === 0) {
      box.children[idx].remove("gray");
      // searchBox.focus();
      idx--;
      return;
    }
    idx--;
    if(idx < box.children.length-1) {
      box.children[idx+1].classList.remove("gray");
    }
    box.children[idx].classList.add("gray");
    box.children[idx].scrollIntoView({ block: "nearest", behavior: "instant" });
    searchBox.value = box.children[idx].textContent;
  }
  else {
    canPopulate = true;
  }
})

const getMatchedCities = keyword => {
  const cities = [];
  if(cache.has(keyword)) {
    return cache.get(keyword);
  }
  for(const city of newData) {
    if(kmp(keyword, city.name + " " + city.country)) {
        cities.push(city);
    }
  }
  cache.set(keyword, cities);
  return cities;
}

const getCities = keyword => {
  return new Promise((resolve, reject) => {
    try {
      resolve(getMatchedCities(keyword));
    }
    catch(err) {
      reject(err);
    }
  })
}

const populateList = (cities) => {
  box.innerHTML = "";
  const fragment = document.createDocumentFragment();
  if(cities.length === 0) {
    noResult.style.display = 'flex';
    box.classList.remove("active");
    return;
  }
  noResult.style.display = 'none';
  for(let i = 0; i < cities.length; i++) {
      const city = cities[i];
      const li = document.createElement("li");
      li.textContent = city.name + " " + city.country;
      li.id = city.id;
      fragment.appendChild(li);
  }
  box.appendChild(fragment);
}


const handleSuggestion = async e => {
  const val = e.target.value.trim();
  idx = -1;
  if(val.length < 2) {
    box.classList.remove("active");
    noResult.style.display = 'none';
  }
  else {
    box.classList.add("active");
    if(canPopulate) {
      const cities = await getCities(val);
      populateList(cities);
    }
  }
}

box.addEventListener("click", e => {
  searchBox.value = e.target.textContent;
  box.classList.remove("active");
  checkWeather(e.target.textContent);
})

function debounce(fn, delay) {
  let debounceToken;
  return function (...args) {
    if (debounceToken) {
      clearTimeout(debounceToken);
    }
    debounceToken = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

searchBox.addEventListener("input", debounce(handleSuggestion, 500));