# TrichyGuard

## AI-Powered Accident Risk Prediction, Zone Classification & Emergency Routing for Tiruchirappalli

TrichyGuard is an AI/ML-powered road-safety and emergency-response system designed for Tiruchirappalli (Trichy), Tamil Nadu.

The project combines accident risk prediction, future risk forecasting, batch risk analysis, accident-zone classification, interactive GIS visualization, hospital search, ambulance route planning, and weather information into a single full-stack application.

---

## Features

### Accident Risk Prediction

Predicts accident risk for a selected TrichyGuard zone using factors such as:

- Traffic density
- Average speed
- Road type
- Road condition
- Rainfall
- Weather
- Historical accident count
- Hour and weekday

The system provides:

- Accident probability
- Risk percentage
- Risk level
- Prediction result

### Future Risk Prediction

Allows users to select a future date, time, and zone to estimate accident risk for that period.

The prediction includes:

- Date
- Time
- Weekday
- Accident probability
- Risk percentage
- Risk level

### Batch Risk Prediction

Evaluates accident risk across multiple TrichyGuard zones for a selected date and time.

The system provides a zone-wise comparison of predicted accident risk.

### Accident Zone Classification

Classifies accident-prone zones using accident, traffic, road, and related indicators.

The application currently works with five TrichyGuard zones:

1. Srirangam
2. Cantonment
3. Thillai Nagar
4. Rockfort
5. Ariyamangalam

### Interactive Risk Map

Provides an interactive map-based visualization of accident risk and incident information across Trichy.

The map supports:

- Zone visualization
- Risk and incident markers
- Risk statistics
- Location-based information
- Emergency routing access

### Hospital Search

Provides hospital information and allows users to search for hospitals near a selected location.

### Ambulance Routing

Provides an emergency route from an accident or selected location to a hospital.

The routing functionality uses geographic coordinates and OSRM-based route calculation.

### Weather Information

Displays weather information associated with the selected TrichyGuard zone.

Weather information can be used as an additional factor for understanding accident-risk conditions.

---

## System Architecture

                    ┌─────────────────────┐
                    │   React Frontend    │
                    │   TypeScript + Vite │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       Risk Prediction   Zone Classification   Weather
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    ML Models        │
                    │    Scikit-learn     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   GIS & Routing     │
                    │   Maps + OSRM       │
                    └─────────────────────┘
Technology Stack
Frontend
React
TypeScript
Vite
Tailwind CSS
React Router
Framer Motion
React Leaflet
Backend
Python
FastAPI
Uvicorn
Machine Learning
Scikit-learn
Random Forest
Classification models
Probability-based risk prediction
GIS & Routing
React Leaflet
OpenStreetMap
GeoJSON
GeoPackage
OSRM
Data
Accident datasets
Weather information
Geographic zone information
Hospital and location data
Project Structure
TrichyGuard/
│
├── backend/
│   └── main.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── data/
│   ├── accident_risk_dataset.csv
│   ├── accident_zone_dataset.csv
│   ├── trichy_zones.geojson
│   └── trichy_zones.gpkg
│
├── models/
│   ├── accident_risk_model.joblib
│   └── accident_zone_model.joblib
│
├── src/
│   ├── risk_prediction/
│   ├── zone_classification/
│   ├── routing/
│   └── spatial/
│
├── tests/
│
├── generate_synthetic_datasets.py
├── requirements.txt
├── trichy_zones.qgz
└── README.md
Running the Project Locally
Clone the Repository
git clone https://github.com/kaviyaazhagesan23-ui/TrichyGuard.git
cd TrichyGuard
Backend Setup

Create a Python virtual environment.

Windows
python -m venv .venv
.venv\Scripts\activate

Install the required Python packages:

pip install -r requirements.txt

Start the FastAPI backend:

python -m uvicorn backend.main:app --reload --port 8000

Backend:

http://localhost:8000

FastAPI Swagger documentation:

http://localhost:8000/docs

Health check:

http://localhost:8000/health
Frontend Setup

Open another terminal:

cd frontend
npm install

Create a local .env file inside the frontend directory:

VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8000

Start the frontend:

npm run dev

Frontend:

http://localhost:5173
Machine Learning Models
Accident Risk Prediction Model
models/accident_risk_model.joblib

The risk prediction model uses features including:

Zone
Hour
Weekday
Traffic density
Average speed
Road type
Road condition
Rainfall
Weather
Historical accident count
Accident Zone Classification Model
models/accident_zone_model.joblib

The zone classification model predicts the corresponding TrichyGuard zone from the supplied accident, traffic, road, and related features.

API Endpoints

The FastAPI backend provides endpoints for:

GET  /health
POST /api/risk/predict
POST /api/risk/future
POST /api/risk/batch
POST /api/classify-zone
GET  /api/hospitals
POST /api/hospitals/nearby
POST /api/ambulance-route
GET  /api/weather
GET  /api/incidents

Interactive API documentation is available at:

http://localhost:8000/docs
TrichyGuard Zones

The application currently works with five project-defined zones:

Zone	Area
Zone 1	Srirangam
Zone 2	Cantonment
Zone 3	Thillai Nagar
Zone 4	Rockfort
Zone 5	Ariyamangalam
Data Disclaimer

Some datasets used in the current development version are synthetic or project-generated for model development and demonstration.

The system is intended as a research and prototype project and should not be treated as an official road-safety or emergency-response system.

Model predictions should not be used as the sole basis for real-world emergency or public-safety decisions.

Future Improvements
Integration with larger real-world accident datasets
Improved zone-level accident prediction
Real-time traffic data integration
Real-time weather integration
Live emergency vehicle tracking
Improved accident hotspot detection
More detailed road-network analysis
Model optimization using additional historical data
Production deployment
Real-time alert and notification system
Project Goal

The goal of TrichyGuard is to explore how artificial intelligence, geographic information systems, weather information, and emergency routing can be combined to support intelligent road-safety analysis and emergency response.

Author

Kaviya Azhagesan

Final-Year B.Tech Computer Science and Engineering
Artificial Intelligence & Machine Learning
