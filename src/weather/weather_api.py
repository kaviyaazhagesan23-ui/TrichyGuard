import requests
from datetime import date, datetime


ZONE_COORDINATES = {
    "Zone_1_Srirangam": {"lat": 10.8688, "lon": 78.6910},
    "Zone_2_Cantonment": {"lat": 10.7975, "lon": 78.6821},
    "Zone_3_ThillaiNagar": {"lat": 10.8231, "lon": 78.6836},
    "Zone_4_Rockfort": {"lat": 10.8286, "lon": 78.6933},
    "Zone_5_Ariyamangalam": {"lat": 10.7925, "lon": 78.7402},
}


def interpret_weather_code(code):
    if code is None:
        return "Clear"

    if code in [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]:
        return "Rainy"

    if code in [45, 48]:
        return "Fog"

    if code in [1, 2, 3]:
        return "Cloudy"

    if code in [95, 96, 99]:
        return "Heavy rain"

    return "Clear"


def get_weather_data(zone, target_date=None):
    """
    Retrieves weather information from Open-Meteo.

    Returns data compatible with the TrichyGuard React Weather page:
    - Current/selected weather
    - Temperature
    - Feels-like temperature
    - Rainfall
    - Wind speed
    - Humidity
    - Visibility
    - Pressure
    - 24-hour forecast
    - 7-day forecast
    """

    coords = ZONE_COORDINATES.get(zone)

    if not coords:
        return {
            "weather": "Clear",
            "temperature_c": 0.0,
            "feels_like_c": 0.0,
            "rainfall_mm": 0.0,
            "wind_kmh": 0.0,
            "humidity": 0.0,
            "visibility_km": 0.0,
            "pressure_hpa": 0.0,
            "hourly": [],
            "daily": [],
            "source": "Unavailable",
        }

    lat = coords["lat"]
    lon = coords["lon"]

    if target_date is None:
        target_date = date.today()

    today = date.today()
    delta_days = (target_date - today).days

    try:
        # ---------------------------------------------------------
        # FUTURE / CURRENT WEATHER
        # ---------------------------------------------------------
        if 0 <= delta_days <= 14:

            url = (
                "https://api.open-meteo.com/v1/forecast"
                f"?latitude={lat}"
                f"&longitude={lon}"
                "&hourly="
                "temperature_2m,"
                "apparent_temperature,"
                "relative_humidity_2m,"
                "precipitation,"
                "rain,"
                "weather_code,"
                "wind_speed_10m,"
                "visibility,"
                "surface_pressure"
                "&daily="
                "temperature_2m_max,"
                "temperature_2m_min,"
                "precipitation_probability_max,"
                "precipitation_sum,"
                "weather_code"
                "&forecast_days=16"
                "&timezone=auto"
            )

            response = requests.get(url, timeout=10)

            if response.status_code == 200:
                return parse_open_meteo_response(
                    response.json(),
                    target_date,
                    "Live Forecast (Open-Meteo)",
                )

        # ---------------------------------------------------------
        # HISTORICAL WEATHER
        # ---------------------------------------------------------
        elif delta_days < 0:

            target_str = target_date.strftime("%Y-%m-%d")

            url = (
                "https://archive-api.open-meteo.com/v1/archive"
                f"?latitude={lat}"
                f"&longitude={lon}"
                f"&start_date={target_str}"
                f"&end_date={target_str}"
                "&hourly="
                "temperature_2m,"
                "apparent_temperature,"
                "relative_humidity_2m,"
                "precipitation,"
                "rain,"
                "weather_code,"
                "wind_speed_10m,"
                "visibility,"
                "surface_pressure"
                "&daily="
                "temperature_2m_max,"
                "temperature_2m_min,"
                "precipitation_probability_max,"
                "precipitation_sum,"
                "weather_code"
                "&timezone=auto"
            )

            response = requests.get(url, timeout=10)

            if response.status_code == 200:
                return parse_open_meteo_response(
                    response.json(),
                    target_date,
                    "Historical Archive (Open-Meteo)",
                )

    except Exception as exc:
        print(f"Weather API error for {zone}: {exc}")

    # -------------------------------------------------------------
    # FALLBACK
    # -------------------------------------------------------------
    return {
        "weather": "Clear",
        "temperature_c": 0.0,
        "feels_like_c": 0.0,
        "rainfall_mm": 0.0,
        "wind_kmh": 0.0,
        "humidity": 0.0,
        "visibility_km": 0.0,
        "pressure_hpa": 0.0,
        "hourly": [],
        "daily": [],
        "source": "Historical Estimate (Fallback)",
    }


def parse_open_meteo_response(data, target_date, source):
    """
    Converts an Open-Meteo response into the structure expected
    by the TrichyGuard frontend.
    """

    hourly_data = data.get("hourly", {})
    daily_data = data.get("daily", {})

    times = hourly_data.get("time", [])

    temperatures = hourly_data.get("temperature_2m", [])
    apparent_temperatures = hourly_data.get("apparent_temperature", [])
    humidity_values = hourly_data.get("relative_humidity_2m", [])
    precipitation_values = hourly_data.get("precipitation", [])
    wind_values = hourly_data.get("wind_speed_10m", [])
    visibility_values = hourly_data.get("visibility", [])
    pressure_values = hourly_data.get("surface_pressure", [])
    weather_codes = hourly_data.get("weather_code", [])

    target_str = target_date.strftime("%Y-%m-%d")

    # -------------------------------------------------------------
    # Find hourly records for the selected day
    # -------------------------------------------------------------

    selected_indices = [
        i
        for i, timestamp in enumerate(times)
        if timestamp.startswith(target_str)
    ]

    hourly = []

    for i in selected_indices[:24]:

        timestamp = times[i]

        try:
            hour = datetime.fromisoformat(timestamp).hour
        except Exception:
            hour = i

        hourly.append(
            {
                "hour": f"{hour:02d}:00",
                "temperature": safe_number(temperatures, i),
                "rainfall": safe_number(precipitation_values, i),
                "wind": safe_number(wind_values, i),
                "humidity": safe_number(humidity_values, i),
            }
        )

    # -------------------------------------------------------------
    # Current / selected-day summary
    # -------------------------------------------------------------

    if selected_indices:
        current_index = selected_indices[0]

        temperature = safe_number(temperatures, current_index)
        feels_like = safe_number(apparent_temperatures, current_index)
        humidity = safe_number(humidity_values, current_index)
        wind = safe_number(wind_values, current_index)
        visibility = safe_number(visibility_values, current_index) / 1000
        pressure = safe_number(pressure_values, current_index)

        rainfall = sum(
            safe_number(precipitation_values, i)
            for i in selected_indices
        )

        weather_code = safe_value(weather_codes, current_index)

    else:
        temperature = 0.0
        feels_like = 0.0
        humidity = 0.0
        wind = 0.0
        visibility = 0.0
        pressure = 0.0
        rainfall = 0.0
        weather_code = 0

    # -------------------------------------------------------------
    # 7-day outlook
    # -------------------------------------------------------------

    daily = []

    daily_times = daily_data.get("time", [])
    daily_highs = daily_data.get("temperature_2m_max", [])
    daily_lows = daily_data.get("temperature_2m_min", [])
    daily_rain_chance = daily_data.get(
        "precipitation_probability_max",
        [],
    )
    daily_rainfall = daily_data.get("precipitation_sum", [])
    daily_codes = daily_data.get("weather_code", [])

    for i, day_string in enumerate(daily_times[:7]):

        try:
            day_date = datetime.strptime(
                day_string,
                "%Y-%m-%d",
            )

            day_label = day_date.strftime("%a")

        except Exception:
            day_label = day_string

        daily.append(
            {
                "day": day_label,
                "high": round(
                    safe_number(daily_highs, i),
                    1,
                ),
                "low": round(
                    safe_number(daily_lows, i),
                    1,
                ),
                "rainChance": round(
                    safe_number(daily_rain_chance, i),
                ),
                "condition": interpret_weather_code(
                    safe_value(daily_codes, i)
                ),
                "rainfall": round(
                    safe_number(daily_rainfall, i),
                    1,
                ),
            }
        )

    return {
        "weather": interpret_weather_code(weather_code),
        "temperature_c": round(temperature, 1),
        "feels_like_c": round(feels_like, 1),
        "rainfall_mm": round(rainfall, 1),
        "wind_kmh": round(wind, 1),
        "humidity": round(humidity, 1),
        "visibility_km": round(visibility, 1),
        "pressure_hpa": round(pressure, 1),
        "hourly": hourly,
        "daily": daily,
        "source": source,
    }


def safe_number(values, index):
    """
    Safely read a numeric value from an Open-Meteo array.
    """
    try:
        value = values[index]

        if value is None:
            return 0.0

        return float(value)

    except (IndexError, TypeError, ValueError):
        return 0.0


def safe_value(values, index):
    """
    Safely read a non-numeric value from an Open-Meteo array.
    """
    try:
        return values[index]
    except (IndexError, TypeError):
        return 0