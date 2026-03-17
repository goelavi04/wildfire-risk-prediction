from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
import os

app = FastAPI(title="Wildfire Prediction API")

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models once when server starts
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

scaler    = joblib.load(os.path.join(BASE, 'models', 'scaler.pkl'))
xgb_model = joblib.load(os.path.join(BASE, 'models', 'xgboost_model.pkl'))
rf_model  = joblib.load(os.path.join(BASE, 'models', 'random_forest_model.pkl'))

# Serve frontend files
app.mount("/static", StaticFiles(directory=os.path.join(BASE, "frontend")), name="static")

@app.get("/")
def serve_frontend():
    return FileResponse(os.path.join(BASE, "frontend", "index.html"))

# Input data structure
class WeatherInput(BaseModel):
    max_temp: float
    min_temp: float
    wind_speed: float
    precipitation: float
    month: int
    season: int
    year: int

@app.post("/predict")
def predict(data: WeatherInput):
    # Build feature row exactly like training
    temp_range      = data.max_temp - data.min_temp
    wind_temp_ratio = data.wind_speed / (data.max_temp + 1)
    day_of_year     = data.month * 30

    input_df = pd.DataFrame([{
        'PRECIPITATION':         data.precipitation,
        'MAX_TEMP':              data.max_temp,
        'MIN_TEMP':              data.min_temp,
        'AVG_WIND_SPEED':        data.wind_speed,
        'YEAR':                  data.year,
        'TEMP_RANGE':            temp_range,
        'WIND_TEMP_RATIO':       wind_temp_ratio,
        'MONTH':                 data.month,
        'SEASON':                data.season,
        'LAGGED_PRECIPITATION':  data.precipitation,
        'LAGGED_AVG_WIND_SPEED': data.wind_speed,
        'DAY_OF_YEAR':           day_of_year,
        'DAY':                   15,
    }])

    scaled   = scaler.transform(input_df)

    xgb_prob = float(xgb_model.predict_proba(scaled)[0][1])
    rf_prob  = float(rf_model.predict_proba(scaled)[0][1])
    ensemble = (xgb_prob + rf_prob) / 2

    if ensemble >= 0.75:
        level = "EXTREME"
        color = "#E63B2E"
    elif ensemble >= 0.55:
        level = "HIGH"
        color = "#F47421"
    elif ensemble >= 0.35:
        level = "MODERATE"
        color = "#F9C21A"
    else:
        level = "LOW"
        color = "#4CAF50"

    return {
        "xgb_probability":      round(xgb_prob * 100, 1),
        "rf_probability":       round(rf_prob  * 100, 1),
        "ensemble_probability": round(ensemble  * 100, 1),
        "risk_level":           level,
        "color":                color,
    }

@app.get("/county_risks")
def county_risks():
    counties = [
        {"county":"Shasta",         "lat":40.75,"lng":-122.0,"min_temp":58,"max_temp":108,"wind":47,"precip":0.0},
        {"county":"Butte",          "lat":39.70,"lng":-121.6,"min_temp":55,"max_temp":102,"wind":38,"precip":0.0},
        {"county":"Napa",           "lat":38.50,"lng":-122.3,"min_temp":52,"max_temp":96, "wind":29,"precip":0.0},
        {"county":"Sonoma",         "lat":38.30,"lng":-122.8,"min_temp":50,"max_temp":88, "wind":20,"precip":0.0},
        {"county":"Santa Barbara",  "lat":34.60,"lng":-119.7,"min_temp":55,"max_temp":91, "wind":25,"precip":0.0},
        {"county":"Ventura",        "lat":34.30,"lng":-119.1,"min_temp":53,"max_temp":89, "wind":23,"precip":0.0},
        {"county":"Los Angeles",    "lat":34.05,"lng":-118.2,"min_temp":60,"max_temp":87, "wind":18,"precip":0.0},
        {"county":"San Diego",      "lat":32.70,"lng":-117.1,"min_temp":58,"max_temp":84, "wind":16,"precip":0.0},
        {"county":"Riverside",      "lat":33.90,"lng":-116.5,"min_temp":62,"max_temp":105,"wind":28,"precip":0.0},
        {"county":"San Bernardino", "lat":34.20,"lng":-116.2,"min_temp":60,"max_temp":108,"wind":30,"precip":0.0},
        {"county":"Kern",           "lat":35.30,"lng":-118.9,"min_temp":64,"max_temp":112,"wind":34,"precip":0.0},
        {"county":"Fresno",         "lat":36.70,"lng":-119.8,"min_temp":58,"max_temp":102,"wind":22,"precip":0.0},
        {"county":"Mendocino",      "lat":39.40,"lng":-123.4,"min_temp":48,"max_temp":86, "wind":22,"precip":0.0},
        {"county":"Siskiyou",       "lat":41.60,"lng":-122.5,"min_temp":50,"max_temp":98, "wind":36,"precip":0.0},
        {"county":"Plumas",         "lat":40.00,"lng":-120.8,"min_temp":46,"max_temp":92, "wind":28,"precip":0.0},
        {"county":"El Dorado",      "lat":38.70,"lng":-120.7,"min_temp":50,"max_temp":93, "wind":24,"precip":0.0},
        {"county":"Trinity",        "lat":40.80,"lng":-123.1,"min_temp":48,"max_temp":99, "wind":35,"precip":0.0},
        {"county":"Tehama",         "lat":40.10,"lng":-122.3,"min_temp":56,"max_temp":104,"wind":41,"precip":0.0},
        {"county":"Humboldt",       "lat":40.80,"lng":-124.1,"min_temp":44,"max_temp":62, "wind":16,"precip":0.3},
        {"county":"San Francisco",  "lat":37.80,"lng":-122.4,"min_temp":52,"max_temp":68, "wind":18,"precip":0.2},
        {"county":"Sacramento",     "lat":38.40,"lng":-121.4,"min_temp":54,"max_temp":98, "wind":20,"precip":0.0},
        {"county":"Placer",         "lat":39.00,"lng":-120.8,"min_temp":48,"max_temp":91, "wind":21,"precip":0.0},
        {"county":"Mariposa",       "lat":37.50,"lng":-119.9,"min_temp":54,"max_temp":95, "wind":21,"precip":0.0},
        {"county":"Tuolumne",       "lat":37.90,"lng":-120.2,"min_temp":52,"max_temp":94, "wind":22,"precip":0.0},
        {"county":"Lake",           "lat":39.10,"lng":-122.8,"min_temp":50,"max_temp":97, "wind":28,"precip":0.0},
    ]

    records = []
    for c in counties:
        records.append({
            'PRECIPITATION':         c['precip'],
            'MAX_TEMP':              c['max_temp'],
            'MIN_TEMP':              c['min_temp'],
            'AVG_WIND_SPEED':        c['wind'],
            'YEAR':                  2024,
            'TEMP_RANGE':            c['max_temp'] - c['min_temp'],
            'WIND_TEMP_RATIO':       c['wind'] / (c['max_temp'] + 1),
            'MONTH':                 7,
            'SEASON':                2,
            'LAGGED_PRECIPITATION':  c['precip'],
            'LAGGED_AVG_WIND_SPEED': c['wind'],
            'DAY_OF_YEAR':           185,
            'DAY':                   4,
        })

    df     = pd.DataFrame(records)
    scaled = scaler.transform(df)
    probs  = xgb_model.predict_proba(scaled)[:, 1]

    result = []
    for i, c in enumerate(counties):
        p = float(probs[i])
        if p >= 0.75:   level = "EXTREME";  color = "#E63B2E"
        elif p >= 0.55: level = "HIGH";     color = "#F47421"
        elif p >= 0.35: level = "MODERATE"; color = "#F9C21A"
        else:           level = "LOW";      color = "#4CAF50"

        result.append({
            "county":      c["county"],
            "lat":         c["lat"],
            "lng":         c["lng"],
            "probability": round(p * 100, 1),
            "level":       level,
            "color":       color,
            "max_temp":    c["max_temp"],
            "min_temp":    c["min_temp"],
            "wind":        c["wind"],
        })

    return result