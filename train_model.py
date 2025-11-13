# 🌾 Farm2Value - Improved Mango Yield Model (with tuning)
# -------------------------------------------------------
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import joblib
import matplotlib.pyplot as plt

# Load dataset (prefer provided verified CSV, fallback to farm2.csv)
csv_candidates = [
    "farm2value_verified_mango_yield.csv",
    "farm2.csv",
]

df = None
for path in csv_candidates:
    try:
        df = pd.read_csv(path)
        print("✅ Loaded dataset:", path, df.shape)
        break
    except Exception as e:
        continue

if df is None:
    raise FileNotFoundError("No dataset found. Place farm2value_verified_mango_yield.csv or farm2.csv in project root.")

# Encode categorical features
le_district = LabelEncoder()
le_season = LabelEncoder()
le_variety = LabelEncoder()
le_soil = LabelEncoder()

df["district"] = le_district.fit_transform(df["district"])
df["season"] = le_season.fit_transform(df["season"])
df["variety"] = le_variety.fit_transform(df["variety"])
df["soil_type"] = le_soil.fit_transform(df["soil_type"])

# Feature engineering
df["rain_temp_ratio"] = df["rainfall_mm"] / (df["temperature_C"] + 1)
df["humidity_temp_index"] = df["humidity_percent"] / (df["temperature_C"] + 1)
df["temp_rain_interaction"] = df["temperature_C"] * df["rainfall_mm"] / 100

# Features and target
X = df.drop("yield_quintal_per_acre", axis=1)
y = df["yield_quintal_per_acre"]

# Scale numeric features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Split
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# Grid search tuning
params = {
    'n_estimators': [200, 300, 400],
    'learning_rate': [0.05, 0.08, 0.1],
    'max_depth': [3, 4, 5],
    'subsample': [0.8, 0.9, 1.0]
}

grid = GridSearchCV(GradientBoostingRegressor(random_state=42),
                    param_grid=params,
                    scoring='r2',
                    cv=5,
                    n_jobs=-1,
                    verbose=1)

grid.fit(X_train, y_train)
best_model = grid.best_estimator_

print("\n🏆 Best parameters found:", grid.best_params_)

# Evaluate
y_pred = best_model.predict(X_test)

r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

cv_r2 = cross_val_score(best_model, X_scaled, y, cv=5, scoring='r2').mean()

print(f"\n📊 Improved Model Performance:")
print(f"R² Score (Test): {r2:.3f}")
print(f"MAE: {mae:.3f}")
print(f"RMSE: {rmse:.3f}")
print(f"Average Cross-Validated R²: {cv_r2:.3f}")

# Plot actual vs predicted
plt.figure(figsize=(6,6))
plt.scatter(y_test, y_pred, color='green', alpha=0.7)
plt.plot([y.min(), y.max()], [y.min(), y.max()], 'r--')
plt.xlabel("Actual Yield (quintals/acre)")
plt.ylabel("Predicted Yield (quintals/acre)")
plt.title("Actual vs Predicted Mango Yield (Improved Farm2Value Model)")
plt.grid(True)
plt.show()

# Save improved model and objects (including standard names)
joblib.dump(best_model, "farm2value_improved_model.pkl")
joblib.dump(scaler, "scaler.pkl")
joblib.dump(le_district, "district_encoder.pkl")
joblib.dump(le_season, "season_encoder.pkl")
joblib.dump(le_variety, "variety_encoder.pkl")
joblib.dump(le_soil, "soil_encoder.pkl")

# Standard filenames
joblib.dump(best_model, "yield.joblib")
joblib.dump(best_model, "yield_prediction_model.joblib")

print("\n💾 Improved model and encoders saved successfully!")
