import os
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

print("=" * 60)
print("TRICHYGUARD: ACCIDENT RISK PREDICTION MODEL TRAINING")
print("=" * 60)

# 1. Define paths
data_path = os.path.join("data", "accident_risk_dataset.csv")
model_dir = "models"
model_path = os.path.join(model_dir, "accident_risk_model.joblib")

os.makedirs(model_dir, exist_ok=True)

# 2. Load dataset
if not os.path.exists(data_path):
    print(f"[ERROR] Dataset not found at {data_path}. Run validation first.")
    exit(1)

df = pd.read_csv(data_path)
df["date"] = pd.to_datetime(df["date"])

# 3. Verify required columns
required_columns = [
    "date", "zone", "hour", "weekday", "traffic_density", 
    "average_speed", "road_type", "road_condition", 
    "rainfall_mm", "weather", "historical_accident_count", 
    "accident_occurred"
]

missing_cols = [col for col in required_columns if col not in df.columns]
if missing_cols:
    print(f"[ERROR] Missing required columns: {missing_cols}")
    exit(1)

print(f"[INFO] Dataset loaded successfully. Total rows: {len(df)}")

# 4. Chronological Split
# Training: 2019-2023, Validation: 2024, Testing: 2025
train_df = df[df["date"].dt.year <= 2023]
val_df = df[df["date"].dt.year == 2024]
test_df = df[df["date"].dt.year == 2025]

print(f"[INFO] Train split (2019-2023): {len(train_df)} rows")
print(f"[INFO] Validation split (2024): {len(val_df)} rows")
print(f"[INFO] Test split (2025): {len(test_df)} rows")

# Check class balance across splits
for split_name, subset in [("Train", train_df), ("Validation", val_df), ("Test", test_df)]:
    pos_ratio = subset["accident_occurred"].mean()
    print(f"       - {split_name} positive class ratio: {pos_ratio:.2f}")

# 5. Prepare Features (X) and Target (y)
# Drop date, dataset source, and target from features to prevent leakage
feature_cols = [
    "zone", "hour", "weekday", "traffic_density", 
    "average_speed", "road_type", "road_condition", 
    "rainfall_mm", "weather", "historical_accident_count"
]
target_col = "accident_occurred"

X_train, y_train = train_df[feature_cols], train_df[target_col]
X_val, y_val = val_df[feature_cols], val_df[target_col]
X_test, y_test = test_df[feature_cols], test_df[target_col]

# 6. Define Preprocessing Pipeline
categorical_features = ["zone", "weekday", "traffic_density", "road_type", "road_condition", "weather"]
numerical_features = ["hour", "average_speed", "rainfall_mm", "historical_accident_count"]

preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), numerical_features),
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
    ]
)

# 7. Define Full Pipeline with Random Forest Classifier
pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(n_estimators=100, random_state=42))
    ]
)

# 8. Train Model
print("\n[INFO] Training model...")
pipeline.fit(X_train, y_train)
print("[SUCCESS] Model training complete.")

# 9. Evaluate Model on Test Set
print("\n" + "-" * 40)
print("EVALUATION ON TEST SET (2025)")
print("-" * 40)

y_pred = pipeline.predict(X_test)
y_prob = pipeline.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_prob)
conf_matrix = confusion_matrix(y_test, y_pred)
class_report = classification_report(y_test, y_pred)

print(f" * Accuracy:  {acc:.4f}")
print(f" * ROC-AUC:   {roc_auc:.4f}")
print(" * Confusion Matrix:")
print(conf_matrix)
print(" * Classification Report:")
print(class_report)

# 10. Save Model
joblib.dump(pipeline, model_path)
print(f"\n[SUCCESS] Saved trained model to {model_path}")


# 11. Prediction Function Example
def predict_accident_risk(input_data_dict):
    """
    Accepts a dictionary of input features and returns accident probability.
    """
    loaded_model = joblib.load(model_path)
    input_df = pd.DataFrame([input_data_dict])
    probability = loaded_model.predict_proba(input_df)[0][1]
    prediction = int(loaded_model.predict(input_df)[0])
    return prediction, probability

# Test sample inference
sample_input = {
    "zone": "Zone_3_ThillaiNagar",
    "hour": 20,
    "weekday": "Friday",
    "traffic_density": "High",
    "average_speed": 22.5,
    "road_type": "Arterial",
    "road_condition": "Poor",
    "rainfall_mm": 12.0,
    "weather": "Rainy",
    "historical_accident_count": 4
}

pred_class, pred_prob = predict_accident_risk(sample_input)
print("\n" + "-" * 40)
print("SAMPLE PREDICTION TEST")
print("-" * 40)
print(f"Input Sample: {sample_input}")
print(f"Predicted Class (1=Accident, 0=No Accident): {pred_class}")
print(f"Predicted Accident Probability: {pred_prob:.4f}")
print("=" * 60)