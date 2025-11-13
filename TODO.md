# TODO: Integrate Weather API and Train Model

## Steps to Complete

- [ ] Add 'requests' to requirements.txt
- [ ] Create weather_fetch.py with functions for OpenWeatherMap (current weather) and Open-Meteo (historical/seasonal data)
- [ ] Modify train_model.py to fetch average weather data for each district-season in farm2.csv, update dataset, and retrain model
- [ ] Modify api.py to fetch current temperature and humidity from OpenWeatherMap for predictions, keep rainfall as input
- [ ] Add new endpoint in api.py for seasonal weather reports using Open-Meteo
- [ ] Install dependencies (pip install -r requirements.txt)
- [ ] Run train_model.py to update and retrain the model
- [ ] Test the APIs (predict endpoint and new seasonal endpoint)
