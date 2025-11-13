import requests
import os
from dotenv import load_dotenv

load_dotenv()

# OpenWeatherMap API key
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')

# District coordinates (approximate for Karnataka districts)
DISTRICT_COORDS = {
    'Tumkur': {'lat': 13.34, 'lon': 77.10},
    'Kolar': {'lat': 13.14, 'lon': 78.13},
    'Mandya': {'lat': 12.52, 'lon': 76.90},
    'Hassan': {'lat': 13.00, 'lon': 76.10},
    'Chikkaballapur': {'lat': 13.43, 'lon': 77.73},
    'Ramanagara': {'lat': 12.72, 'lon': 77.28}
}

def get_current_weather(district):
    """Fetch current temperature and humidity from OpenWeatherMap."""
    if district not in DISTRICT_COORDS:
        raise ValueError(f"District {district} not found in coordinates.")

    coords = DISTRICT_COORDS[district]
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={coords['lat']}&lon={coords['lon']}&appid={OPENWEATHER_API_KEY}&units=metric"

    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"OpenWeatherMap API error: {response.status_code}")

    data = response.json()
    temperature = data['main']['temp']
    humidity = data['main']['humidity']

    return {'temperature_C': temperature, 'humidity_percent': humidity}

def get_seasonal_weather(district, season, year=None):
    """Fetch average weather for a season using Open-Meteo historical API."""
    if district not in DISTRICT_COORDS:
        raise ValueError(f"District {district} not found in coordinates.")

    coords = DISTRICT_COORDS[district]

    # Define season date ranges (approximate)
    season_ranges = {
        'Summer': {'start': '03-01', 'end': '05-31'},
        'Monsoon': {'start': '06-01', 'end': '09-30'},
        'Winter': {'start': '12-01', 'end': '02-28'}
    }

    if season not in season_ranges:
        raise ValueError(f"Season {season} not supported.")

    if year is None:
        year = 2023  # Default to recent year

    start_date = f"{year}-{season_ranges[season]['start']}"
    end_date = f"{year}-{season_ranges[season]['end']}"

    url = f"https://archive-api.open-meteo.com/v1/archive?latitude={coords['lat']}&longitude={coords['lon']}&start_date={start_date}&end_date={end_date}&daily=temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum&timezone=Asia/Kolkata"

    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Open-Meteo API error: {response.status_code}")

    data = response.json()

    # Calculate averages
    temps = data['daily']['temperature_2m_mean']
    humids = data['daily']['relative_humidity_2m_mean']
    rains = data['daily']['precipitation_sum']

    avg_temp = sum(temps) / len(temps) if temps else 0
    avg_humidity = sum(humids) / len(humids) if humids else 0
    total_rain = sum(rains) if rains else 0

    return {
        'temperature_C': avg_temp,
        'humidity_percent': avg_humidity,
        'rainfall_mm': total_rain
    }
