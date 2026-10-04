
from pathlib import Path

from src.weather.weather_api import get_weather_data
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os
from datetime import date, datetime
from typing import List



import uuid
from math import ceil
from typing import Any

import numpy as np

from src.routing.hospital_router import (
    HOSPITALS,
    find_hospitals_in_radius,
    get_osrm_route,
)





# ============================================================
# ADDITIONAL TRICHYGUARD CONFIGURATION
# ============================================================

ZONE_COORDINATES = {
    "Zone_1_Srirangam": (10.8688, 78.6910),
    "Zone_2_Cantonment": (10.7975, 78.6821),
    "Zone_3_ThillaiNagar": (10.8231, 78.6836),
    "Zone_4_Rockfort": (10.8286, 78.6933),
    "Zone_5_Ariyamangalam": (10.7925, 78.7402),
}

ZONE_DISPLAY_NAMES = {
    "Zone_1_Srirangam": "Srirangam",
    "Zone_2_Cantonment": "Cantonment",
    "Zone_3_ThillaiNagar": "Thillai Nagar",
    "Zone_4_Rockfort": "Rockfort",
    "Zone_5_Ariyamangalam": "Ariyamangalam",
}


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RISK_MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "accident_risk_model.joblib"
)


RISK_DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "accident_risk_dataset.csv"
)

risk_pipeline = joblib.load(RISK_MODEL_PATH)








app = FastAPI(title="TrichyGuard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "models" / "accident_risk_model.joblib"

try:
    risk_model = joblib.load(MODEL_PATH)
except Exception as exc:
    risk_model = None
    print(f"Could not load risk model: {exc}")
ZONE_CLASSIFICATION_MODEL_PATH = (
    ROOT / "models" / "accident_zone_model.joblib"
)

try:
    zone_model = joblib.load(ZONE_CLASSIFICATION_MODEL_PATH)
except Exception:
    zone_model = None


class RiskInput(BaseModel):
    zone: str
    hour: int = Field(ge=0, le=23)
    weekday: str
    traffic_density: str
    average_speed: float = Field(ge=0)
    road_type: str
    road_condition: str
    rainfall_mm: float = Field(ge=0)
    weather: str
    historical_accident_count: int = Field(ge=0)







class FutureRiskInput(BaseModel):
    zone: str
    date: str
    hour: int = Field(ge=0, le=23)




class BatchRiskInput(BaseModel):
    date: str
    hour: int = Field(ge=0, le=23)

class ZoneClassificationInput(BaseModel):
    zoneId: str
    accidentsLast12m: int = Field(ge=0)
    trafficDensity: float = Field(ge=0, le=100)
    junctionCount: int = Field(ge=0)
    nightShare: float = Field(ge=0, le=100)
    speedLimit: float = Field(ge=0)
    hospitalWithin5km: bool
class NearbyHospitalRequest(BaseModel):
    center: List[float]
    radiusKm: float = Field(gt=0, le=100)


class RouteOrigin(BaseModel):
    label: str
    position: List[float]


class RouteRequest(BaseModel):
    origin: RouteOrigin
    hospitalId: str
    priority: str = "standard"

ZONES = [
    "Zone_1_Srirangam",
    "Zone_2_Cantonment",
    "Zone_3_ThillaiNagar",
    "Zone_4_Rockfort",
    "Zone_5_Ariyamangalam",
]

RISK_FEATURE_COLS = [
    "zone",
    "hour",
    "weekday",
    "traffic_density",
    "average_speed",
    "road_type",
    "road_condition",
    "rainfall_mm",
    "weather",
    "historical_accident_count",
]



def mode_or_default(subset, col, default):
    if col in subset.columns and not subset[col].empty:
        mode = subset[col].mode()
        if not mode.empty:
            return mode.iloc[0]

    return default



def estimate_future_features(df, zone, weekday, hour, target_date=None):
    if df is None or df.empty:
        raise ValueError("Dataset is empty.")

    zone_df = df[df["zone"] == zone].copy()

    if zone_df.empty:
        raise ValueError(
            f"No historical records found for zone: {zone}."
        )

    matches = zone_df[
        (zone_df["weekday"] == weekday) &
        (zone_df["hour"] == hour)
    ]

    traffic_match_type = "Exact Match (Zone, Weekday, Hour)"

    if len(matches) < 2:
        matches = zone_df[zone_df["hour"] == hour]
        traffic_match_type = "Fallback Match (Zone, Hour)"

    if len(matches) < 2:
        matches = zone_df
        traffic_match_type = "Fallback Match (Zone Average)"

    traffic_density = mode_or_default(
        matches,
        "traffic_density",
        "Medium"
    )

    if (
        "average_speed" in matches.columns
        and not matches["average_speed"].empty
    ):
        average_speed = float(
            matches["average_speed"].mean()
        )

        if pd.isna(average_speed):
            average_speed = 35.0
    else:
        average_speed = 35.0

    road_type = mode_or_default(
        zone_df,
        "road_type",
        "Arterial"
    )

    cond_matches = zone_df[
        (zone_df["weekday"] == weekday) &
        (zone_df["hour"] == hour)
    ]

    if len(cond_matches) < 2:
        cond_matches = zone_df[
            zone_df["hour"] == hour
        ]

    if len(cond_matches) < 2:
        cond_matches = zone_df

    road_condition = mode_or_default(
        cond_matches,
        "road_condition",
        "Good"
    )

    weather_info = {
        "weather": "Clear",
        "rainfall_mm": 0.0,
        "source": "Historical Estimate"
    }

    if target_date is not None:
        api_res = get_weather_data(
            zone,
            target_date
        )

        if api_res.get("source") != "Unavailable":
            weather_info = api_res

    if weather_info["source"] == "Historical Estimate (Fallback)":
        weather = mode_or_default(
            matches,
            "weather",
            "Clear"
        )

        if (
            "rainfall_mm" in matches.columns
            and not matches["rainfall_mm"].empty
        ):
            rainfall = float(
                matches["rainfall_mm"].mean()
            )
        else:
            rainfall = 0.0

        weather_info["weather"] = weather
        weather_info["rainfall_mm"] = round(
            rainfall if not pd.isna(rainfall) else 0.0,
            2
        )

    latest_rec = zone_df.sort_values(
        "date"
    ).iloc[-1]

    hist_count = (
        int(latest_rec["historical_accident_count"])
        if (
            "historical_accident_count" in zone_df.columns
            and not pd.isna(
                latest_rec["historical_accident_count"]
            )
        )
        else 2
    )

    return {
        "traffic_density": traffic_density,
        "average_speed": round(
            average_speed,
            2
        ),
        "traffic_match_type": traffic_match_type,
        "traffic_records_used": len(matches),
        "road_type": road_type,
        "road_condition": road_condition,
        "weather": weather_info["weather"],
        "rainfall_mm": weather_info["rainfall_mm"],
        "weather_source": weather_info["source"],
        "historical_accident_count": hist_count
    }






def load_risk_data():
    if not os.path.exists(RISK_DATA_PATH):
        return None

    df = pd.read_csv(RISK_DATA_PATH)

    required_columns = [
        "date",
        "zone",
        "hour",
        "weekday",
        "traffic_density",
        "average_speed",
        "road_type",
        "road_condition",
        "rainfall_mm",
        "weather",
        "historical_accident_count",
        "accident_occurred",
    ]

    missing_columns = [
        col
        for col in required_columns
        if col not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            "Missing columns in accident dataset: "
            + ", ".join(missing_columns)
        )

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    )

    df = df.dropna(
        subset=["date", "zone"]
    )

    return df

def predict_future_zone(
    historical_df,
    zone,
    target_date,
    hour
):
    weekday = target_date.strftime("%A")

    estimated = estimate_future_features(
        historical_df,
        zone,
        weekday,
        hour,
        target_date=target_date
    )

    model_input = pd.DataFrame([{
        "zone": zone,
        "hour": hour,
        "weekday": weekday,
        "traffic_density": estimated["traffic_density"],
        "average_speed": estimated["average_speed"],
        "road_type": estimated["road_type"],
        "road_condition": estimated["road_condition"],
        "rainfall_mm": estimated["rainfall_mm"],
        "weather": estimated["weather"],
        "historical_accident_count":
            estimated["historical_accident_count"],
    }])

    model_input = model_input[
        RISK_FEATURE_COLS
    ]

    probabilities = risk_model.predict_proba(
        model_input
    )[0]

    classes = list(
        risk_model.classes_
    )

    if 1 not in classes:
        raise ValueError(
            "Accident class 1 is missing from model"
        )

    probability = float(
        probabilities[classes.index(1)]
    )

    prediction = int(
        risk_model.predict(model_input)[0]
    )

    if probability < 0.35:
        risk_level = "Low"
    elif probability < 0.65:
        risk_level = "Moderate"
    else:
        risk_level = "High"

    return {
        "zone": zone,
        "date": target_date.isoformat(),
        "hour": hour,
        "weekday": weekday,
        "prediction": prediction,
        "accident_probability": round(
            probability,
            4
        ),
        "risk_percentage": round(
            probability * 100,
            2
        ),
        "risk_level": risk_level,
        "estimated_features": estimated,
    }

@app.get("/")
def home():
    return {"message": "TrichyGuard API is running"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "risk_model_loaded": risk_model is not None,
    }


@app.post("/api/risk/predict")
def predict_risk(data: RiskInput):
    if risk_model is None:
        raise HTTPException(
            status_code=503,
            detail="Risk model could not be loaded",
        )

    try:
        input_df = pd.DataFrame([data.model_dump()])
        probabilities = risk_model.predict_proba(input_df)[0]
        classes = list(risk_model.classes_)

        if 1 not in classes:
            raise ValueError("Accident class 1 is missing from model")

        probability = float(probabilities[classes.index(1)])
        prediction = int(risk_model.predict(input_df)[0])

        if probability < 0.35:
            risk_level = "Low"
        elif probability < 0.65:
            risk_level = "Moderate"
        else:
            risk_level = "High"

        return {
            "prediction": prediction,
            "accident_probability": round(probability, 4),
            "risk_percentage": round(probability * 100, 2),
            "risk_level": risk_level,
        }

    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))






@app.post("/api/risk/future")
def future_risk(data: FutureRiskInput):
    if risk_model is None:
        raise HTTPException(
            status_code=503,
            detail="Risk model could not be loaded"
        )

    try:
        target_date = datetime.strptime(
            data.date,
            "%Y-%m-%d"
        ).date()

        if data.zone not in ZONES:
            raise ValueError(
                "Invalid zone. Choose one of: "
                + ", ".join(ZONES)
            )

        historical_df = load_risk_data()

        if (
            historical_df is None
            or historical_df.empty
        ):
            raise ValueError(
                "Accident risk dataset could not be loaded."
            )

        return predict_future_zone(
            historical_df,
            data.zone,
            target_date,
            data.hour
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )


















@app.post("/api/risk/batch")
def batch_risk(data: BatchRiskInput):
    if risk_model is None:
        raise HTTPException(
            status_code=503,
            detail="Risk model could not be loaded"
        )

    try:
        target_date = datetime.strptime(
            data.date,
            "%Y-%m-%d"
        ).date()

        historical_df = load_risk_data()

        if historical_df is None or historical_df.empty:
            raise ValueError(
                "Accident risk dataset could not be loaded."
            )

        results = []

        for zone in ZONES:
            result = predict_future_zone(
                historical_df,
                zone,
                target_date,
                data.hour
            )
            results.append(result)

        return {
            "date": target_date.isoformat(),
            "hour": data.hour,
            "results": results
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )



@app.post("/api/classify-zone")
def classify_zone(data: ZoneClassificationInput):

    if zone_model is None:
        raise HTTPException(
            status_code=503,
            detail="Zone classification model is not available."
        )

    if data.zoneId not in ZONE_COORDINATES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown zone: {data.zoneId}"
        )

    # --------------------------------------------------------
    # Adapter from the React UI fields to the trained model's
    # seven expected features.
    # --------------------------------------------------------

    if data.trafficDensity < 34:
        traffic_density = "Low"
    elif data.trafficDensity < 67:
        traffic_density = "Medium"
    else:
        traffic_density = "High"

    average_speed = float(data.speedLimit)

    road_type = "Arterial"
    road_condition = "Good"
    weather = "Clear"
    vehicle_type = "Car"

    accident_time = 22 if data.nightShare >= 50 else 14

    model_input = pd.DataFrame(
        [{
            "traffic_density": traffic_density,
            "average_speed": average_speed,
            "road_type": road_type,
            "road_condition": road_condition,
            "weather": weather,
            "vehicle_type": vehicle_type,
            "accident_time": accident_time,
        }]
    )

    try:
        prediction = zone_model.predict(model_input)[0]

        if hasattr(zone_model, "predict_proba"):
            probabilities = zone_model.predict_proba(model_input)[0]
            classes = zone_model.classes_

            probability_map = {
                str(cls): float(prob)
                for cls, prob in zip(classes, probabilities)
            }

            max_probability = max(probabilities)
        else:
            probability_map = {}
            max_probability = 1.0

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Zone classification failed: {exc}"
        )

    predicted_zone = str(prediction)

    confidence_value = float(max_probability)

    if confidence_value >= 0.70:
        predicted_level = "high"
    elif confidence_value >= 0.45:
        predicted_level = "medium"
    else:
        predicted_level = "low"

    confidence = [
        {
            "level": (
                "high"
                if probability >= 0.70
                else "medium"
                if probability >= 0.45
                else "low"
            ),
            "label": ZONE_DISPLAY_NAMES.get(
                str(zone),
                str(zone)
            ),
            "value": round(float(probability), 4),
        }
        for zone, probability in probability_map.items()
    ]

    confidence.sort(
        key=lambda item: item["value"],
        reverse=True,
    )

    drivers = [
        f"Traffic density: {traffic_density}",
        f"Average speed proxy: {average_speed:.1f} km/h",
        f"Night-time share: {data.nightShare:.0f}%",
        f"Junction count: {data.junctionCount}",
        f"Accidents in last 12 months: {data.accidentsLast12m}",
    ]

    return {
        "zoneId": predicted_zone,
        "predicted": predicted_level,
        "confidence": confidence,
        "drivers": drivers,
        "isMock": False,
        "source": "TrichyGuard trained zone classification model",
    }




def hospital_to_frontend(hospital: dict, distance_km: float | None = None):
    name = hospital["name"]

    if "Government" in name or "Mahatma Gandhi" in name:
        kind = "Public"
    else:
        kind = "Private"

    return {
        "id": name.lower().replace(" ", "-").replace(".", ""),
        "name": name,
        "address": hospital.get("address", "Trichy"),
        "position": [
            float(hospital["lat"]),
            float(hospital["lon"]),
        ],
        "phone": hospital.get("phone"),
        "kind": kind,
        "services": ["Emergency care"],
        "emergency": True,
        "open24x7": True,
        **(
            {
                "distanceKm": round(float(distance_km), 2),
                "etaMin": max(
                    1,
                    round(float(distance_km) / 0.5)
                ),
            }
            if distance_km is not None
            else {}
        ),
    }
@app.get("/api/hospitals")
def get_hospitals():
    return [
        hospital_to_frontend(hospital)
        for hospital in HOSPITALS
    ]


@app.post("/api/hospitals/nearby")
def get_nearby_hospitals(data: NearbyHospitalRequest):

    if len(data.center) != 2:
        raise HTTPException(
            status_code=400,
            detail="center must contain [latitude, longitude]."
        )

    latitude = float(data.center[0])
    longitude = float(data.center[1])

    try:
        hospitals = find_hospitals_in_radius(
            latitude,
            longitude,
            data.radiusKm,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Nearby hospital search failed: {exc}"
        )

    return [
        hospital_to_frontend(
            hospital,
            hospital["distance_km"],
        )
        for hospital in hospitals
    ]




@app.post("/api/ambulance-route")
def ambulance_route(data: RouteRequest):

    if len(data.origin.position) != 2:
        raise HTTPException(
            status_code=400,
            detail="origin.position must contain [latitude, longitude]."
        )

    hospital = None

    for item in HOSPITALS:
        hospital_id = (
            item["name"]
            .lower()
            .replace(" ", "-")
            .replace(".", "")
        )

        if hospital_id == data.hospitalId:
            hospital = item
            break

    if hospital is None:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found."
        )

    origin_lat = float(data.origin.position[0])
    origin_lon = float(data.origin.position[1])

    route = get_osrm_route(
        origin_lat,
        origin_lon,
        float(hospital["lat"]),
        float(hospital["lon"]),
    )

    if route is None:
        raise HTTPException(
            status_code=503,
            detail="OSRM routing service is currently unavailable."
        )

    # OSRM returns [longitude, latitude].
    # React expects [latitude, longitude].
    path = [
        [float(coordinate[1]), float(coordinate[0])]
        for coordinate in route["geometry"]
    ]

    distance_km = float(route["distance_km"])
    eta_min = float(route["duration_mins"])

    priority = (
        "critical"
        if data.priority == "critical"
        else "standard"
    )

    return {
        "id": str(uuid.uuid4()),
        "origin": {
            "label": data.origin.label,
            "position": [
                origin_lat,
                origin_lon,
            ],
        },
        "hospital": hospital_to_frontend(hospital),
        "priority": priority,
        "path": path,
        "distanceKm": distance_km,
        "etaMin": eta_min,
        "steps": [
            {
                "id": "route-summary",
                "title": "OSRM driving route",
                "detail": (
                    f"Drive approximately "
                    f"{distance_km:.2f} km to "
                    f"{hospital['name']}."
                ),
                "distanceKm": distance_km,
            }
        ],
        "alternatives": [],
        "isMock": False,
        "source": "OSRM",
    }

@app.get("/api/incidents")
def get_incidents():
    df = load_risk_data()

    if df.empty:
        return []

    # Only keep actual accident records.
    if "accident_occurred" in df.columns:
        try:
            occurred_mask = (
                pd.to_numeric(
                    df["accident_occurred"],
                    errors="coerce"
                )
                .fillna(0)
                .astype(int)
                == 1
            )
            df = df.loc[occurred_mask].copy()
        except Exception:
            pass

    if df.empty:
        return []

    # Keep only rows belonging to the five configured Trichy zones.
    df = df[df["zone"].astype(str).isin(ZONE_COORDINATES.keys())].copy()

    if df.empty:
        return []

    # ---------------------------------------------------------
    # Calculate risk probabilities in ONE batch.
    # This is much faster than calling predict_proba()
    # separately for every row.
    # ---------------------------------------------------------
    probabilities = [0.5] * len(df)

    if risk_model is not None:
        try:
            model_input = pd.DataFrame({
                "zone": df["zone"].astype(str),

                "hour": pd.to_numeric(
                    df.get("hour", 12),
                    errors="coerce"
                ).fillna(12).astype(int),

                "weekday": df.get(
                    "weekday",
                    pd.Series(
                        ["Monday"] * len(df),
                        index=df.index
                    )
                ).astype(str),

                "traffic_density": df.get(
                    "traffic_density",
                    pd.Series(
                        ["Medium"] * len(df),
                        index=df.index
                    )
                ).astype(str),

                "average_speed": pd.to_numeric(
                    df.get(
                        "average_speed",
                        pd.Series(
                            [40] * len(df),
                            index=df.index
                        )
                    ),
                    errors="coerce"
                ).fillna(40).astype(float),

                "road_type": df.get(
                    "road_type",
                    pd.Series(
                        ["Arterial"] * len(df),
                        index=df.index
                    )
                ).astype(str),

                "road_condition": df.get(
                    "road_condition",
                    pd.Series(
                        ["Good"] * len(df),
                        index=df.index
                    )
                ).astype(str),

                "rainfall_mm": pd.to_numeric(
                    df.get(
                        "rainfall_mm",
                        pd.Series(
                            [0] * len(df),
                            index=df.index
                        )
                    ),
                    errors="coerce"
                ).fillna(0).astype(float),

                "weather": df.get(
                    "weather",
                    pd.Series(
                        ["Clear"] * len(df),
                        index=df.index
                    )
                ).astype(str),

                "historical_accident_count": pd.to_numeric(
                    df.get(
                        "historical_accident_count",
                        pd.Series(
                            [0] * len(df),
                            index=df.index
                        )
                    ),
                    errors="coerce"
                ).fillna(0).astype(int),
            })

            probabilities = risk_model.predict_proba(
                model_input
            )[:, 1].tolist()

        except Exception as exc:
            print(
                f"/api/incidents risk calculation warning: {exc}"
            )

    incidents = []

    for position, (index, row) in enumerate(df.iterrows()):
        zone = str(row["zone"])

        lat, lon = ZONE_COORDINATES[zone]

        probability = float(probabilities[position])

        if probability >= 0.67:
            risk = "high"
        elif probability >= 0.34:
            risk = "medium"
        else:
            risk = "low"

        score = round(probability * 100)

        # Calculate how many days ago the incident occurred.
        try:
            days_ago = (
                pd.Timestamp.today().normalize()
                - pd.to_datetime(row["date"])
            ).days

            days_ago = max(0, int(days_ago))
        except Exception:
            days_ago = 0

        try:
            hour = int(row.get("hour", 12))
        except Exception:
            hour = 12

        if hour < 6:
            time_band = "Night"
        elif hour < 12:
            time_band = "Morning"
        elif hour < 18:
            time_band = "Afternoon"
        else:
            time_band = "Evening"

        weather = str(row.get("weather", "Clear"))

        cause = (
            f"{weather} conditions"
            if weather.lower() != "clear"
            else "Traffic and road conditions"
        )

        incidents.append({
            "id": f"incident-{index}",
            "zoneId": zone,
            "title": (
                f"Accident incident — "
                f"{ZONE_DISPLAY_NAMES.get(zone, zone)}"
            ),
            "position": [
                lat,
                lon,
            ],
            "risk": risk,
            "score": score,
            "daysAgo": days_ago,
            "cause": cause,
            "timeBand": time_band,
        })

    # Most recent incidents first.
    incidents.sort(
        key=lambda item: item["daysAgo"]
    )

    # Keep the API response manageable.
    return incidents[:500]


@app.get("/api/weather")
def weather_endpoint(zone: str):
    if zone not in ZONE_COORDINATES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown zone: {zone}"
        )

    try:
        target_date = date.today()

        result = get_weather_data(
            zone,
            target_date
        )

        return {
            "zoneId": zone,
            "updatedAt": datetime.now().isoformat(),

            "condition": result.get(
                "weather",
                "Clear"
            ),

            "temperatureC": float(
                result.get(
                    "temperature_c",
                    0.0
                )
            ),

            "feelsLikeC": float(
                result.get(
                    "feels_like_c",
                    0.0
                )
            ),

            "rainfallMm": float(
                result.get(
                    "rainfall_mm",
                    0.0
                )
            ),

            "windKmh": float(
                result.get(
                    "wind_kmh",
                    0.0
                )
            ),

            "humidity": float(
                result.get(
                    "humidity",
                    0.0
                )
            ),

            "visibilityKm": float(
                result.get(
                    "visibility_km",
                    0.0
                )
            ),

            "pressureHpa": float(
                result.get(
                    "pressure_hpa",
                    0.0
                )
            ),

            "uvIndex": float(
                result.get(
                    "uv_index",
                    0.0
                )
            ),

            "hourly": result.get(
                "hourly",
                []
            ),

            "daily": result.get(
                "daily",
                []
            ),

            "isMock": (
                "Fallback"
                in result.get(
                    "source",
                    ""
                )
            ),

            "source": result.get(
                "source",
                "Unavailable"
            ),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Weather request failed: {exc}"
        )