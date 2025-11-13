from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)

# Load the model and encoders
def load_model():
    # Load priority: yield_prediction_model.joblib -> yield.joblib -> farm2value_improved_model.pkl
    for path in [
        "yield_prediction_model.joblib",
        "yield.joblib",
        "farm2value_improved_model.pkl",
    ]:
        try:
            return joblib.load(path)
        except Exception:
            continue
    raise FileNotFoundError("No trained model file found. Please run train_model.py to generate yield_prediction_model.joblib.")

model = load_model()
scaler = joblib.load("scaler.pkl")
district_encoder = joblib.load("district_encoder.pkl")
season_encoder = joblib.load("season_encoder.pkl")
variety_encoder = joblib.load("variety_encoder.pkl")
soil_encoder = joblib.load("soil_encoder.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    # Create a dataframe from the input data
    df = pd.DataFrame([data])

    # Encode categorical features
    df["district"] = district_encoder.transform(df["district"])
    df["season"] = season_encoder.transform(df["season"])
    df["variety"] = variety_encoder.transform(df["variety"])
    df["soil_type"] = soil_encoder.transform(df["soil_type"])

    # Feature engineering
    df["rain_temp_ratio"] = df["rainfall_mm"] / (df["temperature_C"] + 1)
    df["humidity_temp_index"] = df["humidity_percent"] / (df["temperature_C"] + 1)
    df["temp_rain_interaction"] = df["temperature_C"] * df["rainfall_mm"] / 100

    # Scale numeric features
    X_scaled = scaler.transform(df)

    # Make a prediction
    prediction = model.predict(X_scaled)

    return jsonify({"yield": prediction[0]})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
