import os
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    RandomForestClassifier,
    ExtraTreesClassifier,
    HistGradientBoostingClassifier
)
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    f1_score,
    classification_report,
    confusion_matrix,
    make_scorer
)

print("=" * 60)
print("TRICHYGUARD: RIGOROUS ZONE MODEL BENCHMARKING & TRAINING")
print("=" * 60)

# 1. Define paths relative to project root
data_path = os.path.join("data", "accident_zone_dataset.csv")
model_dir = "models"
model_path = os.path.join(model_dir, "accident_zone_model.joblib")

os.makedirs(model_dir, exist_ok=True)

# 2. Load dataset
if not os.path.exists(data_path):
    print(f"[ERROR] Dataset not found at {data_path}. Check file path.")
    exit(1)

df = pd.read_csv(data_path)
print(f"[INFO] Loaded Zone Dataset successfully. Total rows: {len(df)}")

# 3. Define features and target
feature_cols = [
    "traffic_density", "average_speed", "road_type", 
    "road_condition", "weather", "vehicle_type", "accident_time"
]
target_col = "zone_id"

X = df[feature_cols]
y = df[target_col]

# Compute Baselines
n_classes = y.nunique()
random_baseline = 1.0 / n_classes
majority_baseline = y.value_counts(normalize=True).max()

print(f"[INFO] Number of Classes: {n_classes}")
print(f"[INFO] Uniform Random Baseline: {random_baseline * 100:.2f}%")
print(f"[INFO] Majority Class Baseline: {majority_baseline * 100:.2f}%")

# 4. Strict Train-Test Split (80% Train, 20% Untouched Test)
X_train_full, X_test, y_train_full, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"[INFO] Training Pool: {len(X_train_full)} rows | Untouched Test Set: {len(X_test)} rows")

# 5. Define Preprocessing & Model Pipelines
numeric_features = ["average_speed", "accident_time"]
categorical_features = ["traffic_density", "road_type", "road_condition", "weather", "vehicle_type"]

# Pipeline 1: Random Forest
preprocessor_rf = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), numeric_features),
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
    ]
)
pipeline_rf = Pipeline(steps=[
    ("preprocessor", preprocessor_rf),
    ("classifier", RandomForestClassifier(n_estimators=150, random_state=42))
])

# Pipeline 2: Extra Trees
preprocessor_et = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), numeric_features),
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
    ]
)
pipeline_et = Pipeline(steps=[
    ("preprocessor", preprocessor_et),
    ("classifier", ExtraTreesClassifier(n_estimators=150, random_state=42))
])

# Pipeline 3: Histogram-Based Gradient Boosting (using Ordinal Encoding for categorical features)
preprocessor_hgb = ColumnTransformer(
    transformers=[
        ("num", "passthrough", numeric_features),
        ("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), categorical_features)
    ]
)
pipeline_hgb = Pipeline(steps=[
    ("preprocessor", preprocessor_hgb),
    ("classifier", HistGradientBoostingClassifier(random_state=42))
])

models = {
    "Random Forest": pipeline_rf,
    "Extra Trees": pipeline_et,
    "Hist Gradient Boosting": pipeline_hgb
}

# 6. Stratified Cross-Validation Benchmarking
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scoring = {
    'accuracy': 'accuracy',
    'balanced_accuracy': 'balanced_accuracy',
    'macro_f1': make_scorer(f1_score, average='macro')
}

print("\n" + "-" * 50)
print("CROSS-VALIDATION BENCHMARK RESULTS (5-Fold Stratified)")
print("-" * 50)

cv_results_summary = {}

for name, model_pipeline in models.items():
    scores = cross_validate(model_pipeline, X_train_full, y_train_full, cv=cv, scoring=scoring)
    
    mean_acc = scores['test_accuracy'].mean()
    std_acc = scores['test_accuracy'].std()
    
    mean_bal_acc = scores['test_balanced_accuracy'].mean()
    std_bal_acc = scores['test_balanced_accuracy'].std()
    
    mean_f1 = scores['test_macro_f1'].mean()
    std_f1 = scores['test_macro_f1'].std()
    
    cv_results_summary[name] = {
        'mean_acc': mean_acc,
        'mean_bal_acc': mean_bal_acc,
        'mean_f1': mean_f1,
        'pipeline': model_pipeline
    }
    
    print(f"Model: {name}")
    print(f"  - Accuracy          : {mean_acc * 100:.2f}% (+/- {std_acc * 100:.2f}%)")
    print(f"  - Balanced Accuracy : {mean_bal_acc * 100:.2f}% (+/- {std_bal_acc * 100:.2f}%)")
    print(f"  - Macro F1-Score    : {mean_f1:.4f} (+/- {std_f1:.4f})")
    print()

# 7. Model Selection based on Cross-Validation Macro F1-Score
best_model_name = max(cv_results_summary, key=lambda k: cv_results_summary[k]['mean_f1'])
best_pipeline = cv_results_summary[best_model_name]['pipeline']

print(f"[SUCCESS] Selected Best Model based on Cross-Validation Macro F1: {best_model_name}")

# 8. Train Selected Model on Full Training Pool & Evaluate on Untouched Test Set
print("\n" + "-" * 50)
print(f"FINAL EVALUATION ON UNTOUCHED TEST SET ({best_model_name})")
print("-" * 50)

best_pipeline.fit(X_train_full, y_train_full)
y_pred = best_pipeline.predict(X_test)

test_acc = accuracy_score(y_test, y_pred)
test_bal_acc = balanced_accuracy_score(y_test, y_pred)
test_macro_f1 = f1_score(y_test, y_pred, average='macro')
conf_matrix = confusion_matrix(y_test, y_pred)
class_report = classification_report(y_test, y_pred)

print(f" * Test Accuracy         : {test_acc * 100:.2f}%")
print(f" * Test Balanced Accuracy: {test_bal_acc * 100:.2f}%")
print(f" * Test Macro F1-Score   : {test_macro_f1:.4f}")
print("\n * Confusion Matrix:")
print(conf_matrix)
print("\n * Classification Report:")
print(class_report)

# 9. Save Final Model Pipeline
joblib.dump(best_pipeline, model_path)
print(f"[SUCCESS] Saved selected model pipeline to {model_path}")


# 10. Prediction Function Compatible with Saved Model
def predict_accident_zone(input_data_dict):
    """
    Accepts a dictionary of zone features and returns the predicted zone ID 
    along with class probabilities.
    """
    loaded_model = joblib.load(model_path)
    input_df = pd.DataFrame([input_data_dict])
    predicted_zone = loaded_model.predict(input_df)[0]
    probabilities = loaded_model.predict_proba(input_df)[0]
    classes = loaded_model.classes_
    prob_dict = {cls: float(prob) for cls, prob in zip(classes, probabilities)}
    return predicted_zone, prob_dict


# Test sample inference check
sample_zone_input = {
    "traffic_density": "High",
    "average_speed": 52.0,
    "road_type": "Highway",
    "road_condition": "Good",
    "weather": "Clear",
    "vehicle_type": "Truck",
    "accident_time": 14
}

pred_zone, pred_probs = predict_accident_zone(sample_zone_input)
print("\n" + "-" * 40)
print("SAMPLE ZONE PREDICTION TEST")
print("-" * 40)
print(f"Input Features: {sample_zone_input}")
print(f"Predicted Zone ID: {pred_zone}")
print(f"Class Probabilities: {pred_probs}")
print("=" * 60)