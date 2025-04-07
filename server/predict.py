#!/usr/bin/env python
import sys
import json
import joblib
import numpy as np

def main():
    # Must receive 4 arguments
    if len(sys.argv) != 5:
        print(json.dumps({"error": "Invalid number of arguments"}))
        return

    try:
        # Convert arguments
        temperature = float(sys.argv[1])
        humidity = float(sys.argv[2])
        ph = float(sys.argv[3])
        rainfall = float(sys.argv[4])
    except ValueError:
        print(json.dumps({"error": "Invalid argument types"}))
        return

    try:
        # Load model
        model = joblib.load("best_model.pkl")
        input_data = np.array([[temperature, humidity, ph, rainfall]])
        prediction = model.predict(input_data)

        # If model output is a list of [N, P, K]
        result = {
            "predicted_nitrogen": float(prediction[0][0]) if hasattr(prediction[0], '__getitem__') else float(prediction[0]),
            "predicted_phosphorus": float(prediction[0][1]) if hasattr(prediction[0], '__getitem__') and len(prediction[0]) > 1 else None,
            "predicted_potassium": float(prediction[0][2]) if hasattr(prediction[0], '__getitem__') and len(prediction[0]) > 2 else None
        }

        print(json.dumps(result))  # ✅ Print single line JSON output
    except Exception as e:
        print(json.dumps({"error": f"Model error: {str(e)}"}))

if __name__ == "__main__":
    main()
