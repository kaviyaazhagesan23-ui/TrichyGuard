import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

# 1. Reproducible Random Seed
np.random.seed(42)

print("=" * 60)
print("TRICHYGUARD: SYNTHETIC DATA GENERATION & CHRONOLOGICAL SPLIT")
print("=" * 60)

# ==========================================
# DATASET 1: accident_risk_dataset.csv (10,000 Rows)
# Spanning 2019 to 2025
# ==========================================
print("\n[INFO] Generating Dataset 1: Accident Risk Prediction (10,000 rows, 2019-2025)...")

n_samples_d1 = 10000
zones = [
    "Zone_1_Srirangam", 
    "Zone_2_Cantonment", 
    "Zone_3_ThillaiNagar", 
    "Zone_4_Rockfort", 
    "Zone_5_Ariyamangalam"
]
road_types = ["Highway", "Arterial", "Local"]
road_conditions = ["Good", "Fair", "Poor"]
weather_conditions = ["Clear", "Rainy", "Foggy"]

# Date range updated to Jan 1, 2019 - Dec 31, 2025
all_dates = pd.date_range(start="2019-01-01", end="2025-12-31", freq="D")
date_col = pd.to_datetime(np.random.choice(all_dates, n_samples_d1))
zone_col = np.random.choice(zones, n_samples_d1)
hour_col = np.random.randint(0, 24, n_samples_d1)
weekday_col = date_col.day_name()

traffic_density = np.random.choice(["Low", "Medium", "High"], n_samples_d1, p=[0.3, 0.5, 0.2])
average_speed = np.random.normal(45, 12, n_samples_d1).clip(10, 80)
rainfall = np.random.choice([0.0, 2.5, 12.0, 25.4], n_samples_d1, p=[0.7, 0.15, 0.1, 0.05])
weather = np.where(rainfall > 10, "Rainy", np.random.choice(["Clear", "Foggy"], n_samples_d1, p=[0.85, 0.15]))
road_condition = np.random.choice(["Good", "Fair", "Poor"], n_samples_d1, p=[0.5, 0.35, 0.15])
historical_accidents = np.random.poisson(lam=3, size=n_samples_d1)

# Leakage-Safe Risk Score Calculation (Pre-accident indicators only)
risk_score = (
    (np.isin(hour_col, [8, 9, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2]).astype(int) * 1.5) +
    (traffic_density == "High").astype(int) * 2.0 +
    (road_condition == "Poor").astype(int) * 1.8 +
    (rainfall > 10).astype(int) * 1.5 +
    (average_speed < 25).astype(int) * 1.0 +
    (historical_accidents * 0.2)
)

probabilities = 1 / (1 + np.exp(-(risk_score - np.mean(risk_score))))
accident_occurred = np.random.binomial(1, probabilities)

df_risk = pd.DataFrame({
    "date": date_col,
    "zone": zone_col,
    "hour": hour_col,
    "weekday": weekday_col,
    "traffic_density": traffic_density,
    "average_speed": np.round(average_speed, 1),
    "road_type": np.random.choice(road_types, n_samples_d1),
    "road_condition": road_condition,
    "rainfall_mm": rainfall,
    "weather": weather,
    "historical_accident_count": historical_accidents,
    "dataset_source": "synthetic_trichyguard_not_real_stats",
    "accident_occurred": accident_occurred
})

df_risk.to_csv("accident_risk_dataset.csv", index=False)
print("[SUCCESS] Saved 'accident_risk_dataset.csv' (Rows: {})".format(len(df_risk)))


# ==========================================
# DATASET 2: accident_zone_dataset.csv (2,500 Rows)
# Meaningful simulated patterns per zone
# ==========================================
print("\n[INFO] Generating Dataset 2: Accident Zone Classification (2,500 rows)...")

n_samples_d2 = 2500
zone_targets = np.random.choice(zones, n_samples_d2)

d2_traffic = []
d2_speed = []
d2_road_type = []
d2_road_cond = []
d2_weather = []
d2_vehicle = []
d2_time = []

for z in zone_targets:
    d2_time.append(np.random.randint(0, 24))
    d2_weather.append(np.random.choice(weather_conditions, p=[0.75, 0.18, 0.07]))
    
    if z == "Zone_1_Srirangam":
        d2_traffic.append(np.random.choice(["Low", "Medium", "High"], p=[0.4, 0.5, 0.1]))
        d2_speed.append(np.clip(np.random.normal(32, 8), 10, 60))
        d2_road_type.append(np.random.choice(road_types, p=[0.1, 0.5, 0.4]))
        d2_road_cond.append(np.random.choice(road_conditions, p=[0.4, 0.4, 0.2]))
        d2_vehicle.append(np.random.choice(["Two-Wheeler", "Car", "Auto-Rickshaw", "Bus", "Truck"], p=[0.6, 0.25, 0.1, 0.03, 0.02]))
        
    elif z == "Zone_2_Cantonment":
        d2_traffic.append(np.random.choice(["Low", "Medium", "High"], p=[0.1, 0.4, 0.5]))
        d2_speed.append(np.clip(np.random.normal(38, 10), 10, 70))
        d2_road_type.append(np.random.choice(road_types, p=[0.2, 0.6, 0.2]))
        d2_road_cond.append(np.random.choice(road_conditions, p=[0.5, 0.35, 0.15]))
        d2_vehicle.append(np.random.choice(["Two-Wheeler", "Car", "Auto-Rickshaw", "Bus", "Truck"], p=[0.4, 0.4, 0.1, 0.07, 0.03]))
        
    elif z == "Zone_3_ThillaiNagar":
        d2_traffic.append(np.random.choice(["Low", "Medium", "High"], p=[0.15, 0.35, 0.5]))
        d2_speed.append(np.clip(np.random.normal(30, 9), 10, 55))
        d2_road_type.append(np.random.choice(road_types, p=[0.05, 0.55, 0.4]))
        d2_road_cond.append(np.random.choice(road_conditions, p=[0.55, 0.3, 0.15]))
        d2_vehicle.append(np.random.choice(["Two-Wheeler", "Car", "Auto-Rickshaw", "Bus", "Truck"], p=[0.45, 0.35, 0.15, 0.03, 0.02]))
        
    elif z == "Zone_4_Rockfort":
        d2_traffic.append(np.random.choice(["Low", "Medium", "High"], p=[0.2, 0.4, 0.4]))
        d2_speed.append(np.clip(np.random.normal(26, 7), 10, 50))
        d2_road_type.append(np.random.choice(road_types, p=[0.1, 0.4, 0.5]))
        d2_road_cond.append(np.random.choice(road_conditions, p=[0.3, 0.4, 0.3]))
        d2_vehicle.append(np.random.choice(["Two-Wheeler", "Car", "Auto-Rickshaw", "Bus", "Truck"], p=[0.5, 0.2, 0.2, 0.08, 0.02]))
        
    else:  # Zone_5_Ariyamangalam
        d2_traffic.append(np.random.choice(["Low", "Medium", "High"], p=[0.3, 0.4, 0.3]))
        d2_speed.append(np.clip(np.random.normal(52, 12), 20, 80))
        d2_road_type.append(np.random.choice(road_types, p=[0.5, 0.3, 0.2]))
        d2_road_cond.append(np.random.choice(road_conditions, p=[0.4, 0.4, 0.2]))
        d2_vehicle.append(np.random.choice(["Two-Wheeler", "Car", "Auto-Rickshaw", "Bus", "Truck"], p=[0.3, 0.25, 0.05, 0.2, 0.2]))

df_zone = pd.DataFrame({
    "zone_id": zone_targets,
    "traffic_density": d2_traffic,
    "average_speed": np.round(d2_speed, 1),
    "road_type": d2_road_type,
    "road_condition": d2_road_cond,
    "weather": d2_weather,
    "vehicle_type": d2_vehicle,
    "accident_time": d2_time,
    "dataset_source": "synthetic_trichyguard_not_real_stats"
})

df_zone.to_csv("accident_zone_dataset.csv", index=False)
print("[SUCCESS] Saved 'accident_zone_dataset.csv' (Rows: {})".format(len(df_zone)))


# ==========================================
# COMPREHENSIVE VALIDATION CHECKS
# ==========================================
print("\n" + "=" * 30 + " VALIDATION REPORT " + "=" * 30)

def validate_dataset(df, name, target_col):
    print(f"\nValidating {name}:")
    missing = df.isnull().sum().sum()
    duplicates = df.duplicated().sum()
    print(f" * Missing Values: {missing} (Expected: 0)")
    print(f" * Duplicate Rows: {duplicates}")
    print(f" * Target Distribution:\n{df[target_col].value_counts(normalize=True)}")
    
    if name.startswith("Dataset 1"):
        invalid_speeds = ((df["average_speed"] < 10) | (df["average_speed"] > 80)).sum()
        invalid_hours = ((df["hour"] < 0) | (df["hour"] > 23)).sum()
        print(f" * Invalid Speeds (<10 or >80): {invalid_speeds}")
        print(f" * Invalid Hours (<0 or >23): {invalid_hours}")
    else:
        invalid_speeds = ((df["average_speed"] < 10) | (df["average_speed"] > 80)).sum()
        invalid_times = ((df["accident_time"] < 0) | (df["accident_time"] > 23)).sum()
        print(f" * Invalid Speeds (<10 or >80): {invalid_speeds}")
        print(f" * Invalid Accident Times (<0 or >23): {invalid_times}")

validate_dataset(df_risk, "Dataset 1 (Risk)", "accident_occurred")
validate_dataset(df_zone, "Dataset 2 (Zone)", "zone_id")


# ==========================================
# CHRONOLOGICAL SPLITS (DATASET 1) & STRATIFIED SPLIT (DATASET 2)
# ==========================================
print("\n" + "=" * 30 + " CHRONOLOGICAL & MODEL SPLITS " + "=" * 30)

# Dataset 1: Chronological Split (Train: 2019-2023, Val: 2024, Test: 2025)
train_risk = df_risk[df_risk["date"].dt.year <= 2023]
val_risk = df_risk[df_risk["date"].dt.year == 2024]
test_risk = df_risk[df_risk["date"].dt.year == 2025]

print(f"Dataset 1 (Chronological Split):")
print(f" -> Train (2019-2023) Shape: {train_risk.shape} | Accident Ratio: {train_risk['accident_occurred'].mean():.2f}")
print(f" -> Val (2024) Shape:   {val_risk.shape}   | Accident Ratio: {val_risk['accident_occurred'].mean():.2f}")
print(f" -> Test (2025) Shape:  {test_risk.shape}  | Accident Ratio: {test_risk['accident_occurred'].mean():.2f}")

# Dataset 2: Stratified Split
X_zone = df_zone.drop(columns=["zone_id", "dataset_source"])
y_zone = df_zone["zone_id"]
X_zone_train, X_zone_val, y_zone_train, y_zone_val = train_test_split(
    X_zone, y_zone, test_size=0.2, random_state=42, stratify=y_zone
)
print(f"\nDataset 2 (Zone Classification Stratified Split):")
print(f" -> Train Shape: {X_zone_train.shape}, Validation Shape: {X_zone_val.shape}")

print("\n" + "=" * 60)
print("[DISCLAIMER] The data generated by this script is purely synthetic.")
print("It does NOT represent actual Trichy accident statistics, and high")
print("accuracy scores on this data do not guarantee real-world performance.")
print("=" * 60)