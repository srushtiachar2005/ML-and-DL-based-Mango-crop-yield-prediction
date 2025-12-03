import sys
import os
import cv2
import numpy as np
from tensorflow.keras.models import load_model
from PIL import Image

def predict_yield_from_image(image_path):
    """
    Predict mango yield (count) from an image using the trained U-Net segmentation model.
    """
    try:
        # Load the trained U-Net model
        model_path = "mango_segmentation_model.h5"
        if not os.path.exists(model_path):
            print("Error: Trained model 'mango_segmentation_model.h5' not found. Please run image_train.py first.")
            return 0

        model = load_model(model_path)
        print("Model loaded successfully")

        # Load and preprocess the input image
        img = cv2.imread(image_path)
        if img is None:
            print(f"Error: Could not load image from {image_path}")
            return 0

        # Resize to model input size (224x224 as per training)
        img_resized = cv2.resize(img, (224, 224))
        img_normalized = img_resized.astype(np.float32) / 255.0

        # Add batch dimension
        img_input = np.expand_dims(img_normalized, axis=0)

        # Perform segmentation
        prediction = model.predict(img_input, verbose=0)

        # Remove batch dimension and get the mask
        mask = prediction[0]

        # Threshold the mask
        mask_binary = (mask > 0.5).astype(np.uint8)

        # Convert to 3-channel mask for visualization
        mask_rgb = np.zeros_like(img_resized)
        mask_rgb[mask_binary[:, :, 0] == 1] = [0, 255, 0]  # Green for mango regions

        # Overlay the mask on the original image
        overlay = cv2.addWeighted(img_resized, 0.7, mask_rgb, 0.3, 0)

        # Save the overlay for debugging
        output_path = f"temp/segmented_{os.path.basename(image_path)}"
        os.makedirs("temp", exist_ok=True)
        cv2.imwrite(output_path, overlay)
        print(f"Segmentation result saved to {output_path}")

        # Count mangoes in the segmented image
        mango_count = count_mangoes_from_mask(mask_binary)

        print(f"Predicted mango yield: {mango_count} mangoes")
        return mango_count

    except Exception as e:
        print(f"Error in yield prediction: {str(e)}")
        return 0

def count_mangoes_from_mask(mask):
    """
    Count mangoes from the binary segmentation mask.
    """
    try:
        # Apply morphological operations to clean up the mask
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

        # Find contours
        contours, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Filter contours based on properties
        mango_contours = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            perimeter = cv2.arcLength(cnt, True)
            if perimeter == 0:
                continue

            # Calculate circularity
            circularity = 4 * np.pi * area / (perimeter * perimeter)

            # Filter based on area, circularity, and other properties
            if (area > 20 and area < 15000 and  # Reasonable area range
                circularity > 0.3 and  # Not too elongated
                len(cnt) > 8):  # Sufficient contour points
                mango_contours.append(cnt)

        # If still low count, try watershed for overlapping mangoes
        if len(mango_contours) < 5 and np.sum(mask > 0) > 2000:
            try:
                # Distance transform for watershed
                dist_transform = cv2.distanceTransform(mask.astype(np.uint8), cv2.DIST_L2, 5)
                _, sure_fg = cv2.threshold(dist_transform, 0.3 * dist_transform.max(), 255, 0)
                sure_fg = np.uint8(sure_fg)

                # Find sure background
                sure_bg = cv2.dilate(mask.astype(np.uint8), kernel, iterations=2)

                # Unknown region
                unknown = cv2.subtract(sure_bg, sure_fg)

                # Marker labelling
                _, markers = cv2.connectedComponents(sure_fg)

                # Add one to all labels
                markers = markers + 1

                # Mark unknown region with zero
                markers[unknown == 255] = 0

                # Apply watershed
                markers = cv2.watershed(cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR), markers)

                # Count unique regions
                unique_markers = np.unique(markers)
                watershed_count = len([m for m in unique_markers if m > 1])

                # Use watershed count if significantly higher
                if watershed_count > len(mango_contours) * 1.5:
                    mango_contours = list(range(watershed_count))
            except Exception as watershed_error:
                print(f"Watershed failed: {watershed_error}")

        return len(mango_contours)

    except Exception as e:
        print(f"Error counting mangoes: {str(e)}")
        return 0

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python image_yield_predict.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    yield_prediction = predict_yield_from_image(image_path)
    print(yield_prediction)
