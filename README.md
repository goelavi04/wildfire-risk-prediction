# California Wildfire Risk Prediction

A machine learning web application that predicts wildfire risk across California counties using 40 years of historical weather data.

Built by **Aviral Goel**

---

## Live Demo

> Deploy link will appear here after deployment

---

## Overview

Wildfires are one of California's most devastating natural disasters. This project uses machine learning to predict the probability of a fire starting on any given day based on weather conditions like temperature, wind speed, precipitation, and seasonal patterns.

The model was trained on the **California Weather and Fire Dataset (1984–2025)** containing 14,988 records of daily weather observations with fire occurrence labels.

---

## Features

- **Live Fire Risk Predictor** — Enter weather conditions and get instant fire risk prediction
- **Interactive Risk Map** — Visual heatmap of fire risk across California counties using Leaflet.js
- **Model Performance Dashboard** — ROC curves, confusion matrix, and metric comparisons
- **Ensemble Prediction** — Combines XGBoost and Random Forest for more reliable results

---

## Machine Learning Models

| Model | Accuracy | Precision | Recall | F1 Score | ROC-AUC |
|-------|----------|-----------|--------|----------|---------|
| XGBoost | 80.0% | 0.720 | 0.655 | 0.686 | 0.863 |
| Random Forest | 79.3% | 0.703 | 0.651 | 0.676 | 0.857 |

### Top Predictive Features

| Rank | Feature | Importance |
|------|---------|------------|
| 1 | Season | 26.2% |
| 2 | Min Temperature | 23.9% |
| 3 | Day of Year | 7.2% |
| 4 | Month | 7.1% |
| 5 | Lagged Precipitation | 6.8% |
| 6 | Max Temperature | 6.1% |

---

## Dataset

- **Source:** [Kaggle — Aleen Khaled](https://www.kaggle.com/datasets/aleenkhaled/california-weather-and-fire-prediction-dataset)
- **Period:** 1984–2025
- **Records:** 14,988
- **Target:** FIRE_START_DAY (True/False)
- **Features:** 13 weather variables including temperature, wind speed, precipitation, drought index, and seasonal indicators

---

## Tech Stack

**Backend**
- Python 3.11
- FastAPI — REST API server
- XGBoost — Gradient boosting model
- Scikit-learn — Random Forest and evaluation metrics
- Joblib — Model serialization

**Frontend**
- HTML5, CSS3, Vanilla JavaScript
- Leaflet.js — Interactive maps
- Chart.js — Performance charts

**Data Analysis**
- Pandas, NumPy — Data processing
- Matplotlib, Seaborn — Visualizations
- Folium — Geographic visualization

---

## Project Structure
```
wildfire_prediction/
│
├── backend/
│   └── main.py              # FastAPI server and prediction endpoints
│
├── frontend/
│   ├── index.html           # Main web interface
│   ├── style.css            # Styling
│   └── app.js               # Interactive logic
│
├── notebooks/
│   └── 01_EDA.ipynb         # Exploratory data analysis
│
├── models/                  # Trained model files (not tracked in git)
│   ├── xgboost_model.pkl
│   ├── random_forest_model.pkl
│   └── scaler.pkl
│
├── data/                    # Dataset (not tracked in git)
│   └── ca_fire.csv
│
├── outputs/                 # Generated plots (not tracked in git)
│
├── requirements.txt
└── README.md
```

---

## Installation and Setup

### 1. Clone the repository
```bash
git clone https://github.com/AviralGoel/wildfire-risk-prediction.git
cd wildfire-risk-prediction
```

### 2. Create virtual environment
```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Download dataset

Download the dataset from [Kaggle](https://www.kaggle.com/datasets/aleenkhaled/california-weather-and-fire-prediction-dataset) and place it in the `data/` folder.

### 5. Train the models

Open and run `notebooks/01_EDA.ipynb` — this trains both models and saves them to the `models/` folder.

### 6. Run the application
```bash
uvicorn backend.main:app --reload
```

Open your browser at `http://127.0.0.1:8000`

---

## How It Works
```
Raw Weather Data
      ↓
Feature Engineering (Temp Range, Wind-Temp Ratio, Seasonal Encoding)
      ↓
StandardScaler Normalization
      ↓
XGBoost + Random Forest (Parallel)
      ↓
Ensemble Average (Mean Probability)
      ↓
Risk Level Classification
(Low / Moderate / High / Extreme)
```

---

## Research Reference

This project draws inspiration from recent research on ML-based wildfire prediction:

> Wildfire risk prediction using machine learning and weather data.
> ScienceDirect — Environmental Modelling and Software (2025)
> https://www.sciencedirect.com/science/article/pii/S2590197425000485

---

## Results and Key Findings

- **Season** is the single most important predictor — Summer conditions increase fire probability dramatically
- **Minimum Temperature** matters more than Maximum Temperature — warm nights that prevent moisture recovery are a key risk factor
- **Recent precipitation** has a strong protective effect — even small amounts of rain significantly reduce risk
- **ROC-AUC of 0.863** means the model has excellent ability to distinguish fire days from non-fire days
- XGBoost outperforms Random Forest on all metrics, likely due to its ability to capture non-linear interactions between weather variables

---

## Author

**Aviral Goel**
California Wildfire Risk Prediction — Machine Learning Project
```

Save with **Ctrl+S**.

---

Now also create `requirements.txt`. Run in terminal:
```
New-Item requirements.txt
```

Open it and paste:
```
fastapi
uvicorn
pandas
numpy
scikit-learn
xgboost
folium
matplotlib
seaborn
joblib
python-multipart
```

