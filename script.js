// DOM Element Selections
const inputBox = document.querySelector('.input-box');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const weather_img = document.querySelector('.weather-img');
const temperature = document.querySelector('.temperature');
const description = document.querySelector('.description');
const humidity = document.getElementById('humidity');
const wind_speed = document.getElementById('wind-speed');
const feelsLike = document.getElementById('feels-like');
const sunriseTime = document.getElementById('sunrise');
const sunsetTime = document.getElementById('sunset');
const unitToggleBtn = document.getElementById('unitToggleBtn');

const location_not_found = document.querySelector('.location-not-found');
const weather_body = document.querySelector('.weather-body');

// API Configuration
const API_KEY = "d3a9695cea0dea13d70d03069af845ad";

// Search History Management Class
class SearchHistory {
    constructor() {
        // Initialize search history from localStorage
        this.history = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];
        this.renderSearchHistory();
    }

    // Add a new search to history
    addSearch(city) {
        // Validate and clean city name
        city = this.validateCityName(city);
        
        // Remove duplicates and limit to 5 recent searches
        this.history = this.history.filter(item => item !== city);
        this.history.unshift(city);
        this.history = this.history.slice(0, 5);
        
        // Save to localStorage
        this.save();
        
        // Render updated history
        this.renderSearchHistory();
    }

    // Validate and clean city name
    validateCityName(city) {
        return city.trim()
            .replace(/[^a-zA-Z\s]/g, '')
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Save history to localStorage
    save() {
        localStorage.setItem('weatherSearchHistory', JSON.stringify(this.history));
    }

    // Render search history to the UI
    renderSearchHistory() {
        const recentSearchesList = document.getElementById('recentSearchesList');
        
        // Clear existing list
        recentSearchesList.innerHTML = '';

        // Create list items for each search
        this.history.forEach(city => {
            const listItem = document.createElement('li');
            listItem.textContent = city;
            
            // Add click event to re-search the city
            listItem.addEventListener('click', () => {
                fetchWeatherData(city);
                inputBox.value = city;
            });

            recentSearchesList.appendChild(listItem);
        });
    }

    // Get current history
    getHistory() {
        return this.history;
    }
}

// Initialize search history
const searchHistory = new SearchHistory();

// Weather Data Fetching
async function fetchWeatherData(query) {
    try {
        // Show loading state
        weather_body.style.display = "none";
        location_not_found.style.display = "none";
        
        // Determine API call type (coordinates or city name)
        const url = typeof query === 'object' 
            ? `https://api.openweathermap.org/data/2.5/weather?lat=${query.lat}&lon=${query.lon}&appid=${API_KEY}&units=metric`
            : `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${API_KEY}&units=metric`;

        const response = await fetch(url);
        const weather_data = await response.json();

        // Handle different response scenarios
        if (weather_data.cod === "404") {
            handleLocationNotFound();
            return;
        }

        updateWeatherUI(weather_data);
        
        // Add to search history only for successful searches
        if (typeof query === 'string') {
            searchHistory.addSearch(query);
        }
    } catch (error) {
        handleError(error);
    }
}

// Update Weather UI
function updateWeatherUI(weather_data) {
    // Display weather body
    location_not_found.style.display = "none";
    weather_body.style.display = "flex";

    // Update main weather details
    const temp = Math.round(weather_data.main.temp);
    temperature.innerHTML = `${temp} <sup>°C</sup>`;
    description.innerHTML = weather_data.weather[0].description;
    humidity.innerHTML = `${weather_data.main.humidity}%`;
    wind_speed.innerHTML = `${weather_data.wind.speed} Km/H`;
    
    // Feels like temperature
    feelsLike.innerHTML = `${Math.round(weather_data.main.feels_like)}°C`;

    // Sunrise and Sunset
    const sunrise = new Date(weather_data.sys.sunrise * 1000);
    const sunset = new Date(weather_data.sys.sunset * 1000);
    sunriseTime.innerHTML = sunrise.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    sunsetTime.innerHTML = sunset.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    // Dynamic Weather Image
    updateWeatherImage(weather_data.weather[0].main);
}

// Update Weather Image
function updateWeatherImage(weatherMain) {
    const weatherImages = {
        'Clouds': 'images/cloud.png',
        'Clear': 'images/clear.png',
        'Rain': 'images/rain.png',
        'Mist': 'images/mist.png',
        'Snow': 'images/snow.png',
        'Haze': 'images/mist.png',
        'Thunderstorm': 'images/rain.png',
        
    };

    // Normalize weatherMain for case-insensitive matching
    const normalizedWeather = weatherMain.trim().toLowerCase();
    

    // Find the correct image by checking keys case-insensitively
    const matchedKey = Object.keys(weatherImages).find(key => key.toLowerCase() === normalizedWeather);

    // Use matched key or default to clouds
    weather_img.src = matchedKey ? weatherImages[matchedKey] : 'images/cloud.png';
}



// Handle Location Not Found
function handleLocationNotFound() {
    location_not_found.style.display = "flex";
    weather_body.style.display = "none";
}

// Error Handling
function handleError(error) {
    console.error("Weather Fetch Error:", error);
    alert("Unable to fetch weather data. Please try again.");
}

// Geolocation
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                fetchWeatherData(coords);
            },
            (error) => {
                console.error("Geolocation Error:", error);
                alert("Unable to retrieve your location.");
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}



// Temperature Unit Conversion
function toggleTemperatureUnit() {
    const tempElement = document.querySelector('.temperature');
    const currentTemp = parseFloat(tempElement.textContent);
    const isCurrentlyC = tempElement.innerHTML.includes('°C');

    if (isCurrentlyC) {
        // Convert to Fahrenheit
        const fahrenheit = (currentTemp * 9/5) + 32;
        tempElement.innerHTML = `${Math.round(fahrenheit)} <sup>°F</sup>`;
    } else {
        // Convert back to Celsius
        const celsius = (currentTemp - 32) * 5/9;
        tempElement.innerHTML = `${Math.round(celsius)} <sup>°C</ sup>`;
    }
}

// Event Listeners
searchBtn.addEventListener('click', () => {
    const searchQuery = inputBox.value.trim();
    if (searchQuery) {
        fetchWeatherData(searchQuery);
    }
});

inputBox.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const searchQuery = inputBox.value.trim();
        if (searchQuery) {
            fetchWeatherData(searchQuery);
        }
    }
});

locationBtn.addEventListener('click', getCurrentLocation);
unitToggleBtn.addEventListener('click', toggleTemperatureUnit);

// Load city suggestions on page load
document.addEventListener('DOMContentLoaded', loadCitySuggestions);