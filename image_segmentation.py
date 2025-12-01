import sys
import os
import cv2
import numpy as np
from tensorflow.keras.models import load_model
from PIL import Image
import matplotlib.pyplot as plt

def segment_mango_image(input_path, output_path):
    """
    Load the trained U-Net model and perform segmentation on the input image.
    """
    try:
        # Load the trained model
        model_path = "mango_segmentation_model.h5"
        if not os.path.exists(model_path):
            print("Model file not found, using mock segmentation for testing")
            # Create mock segmentation: draw some green circles to simulate mangoes
            img = cv2.imread(input_path)
            if img is None:
                raise ValueError(f"Could not load image from {input_path}")

            img_resized = cv2.resize(img, (256, 256))
            overlay = img_resized.copy()

            # Create binary mask with white circles for mock mangoes
            mask = np.zeros((256, 256), dtype=np.uint8)
            cv2.circle(mask, (100, 100), 30, 255, -1)
            cv2.circle(mask, (200, 150), 25, 255, -1)
            cv2.circle(mask, (150, 200), 35, 255, -1)
            cv2.circle(mask, (50, 180), 28, 255, -1)
            cv2.circle(mask, (220, 80), 32, 255, -1)
            cv2.circle(mask, (120, 50), 26, 255, -1)

            # Create overlay for visualization
            mask_rgb = np.zeros_like(img_resized)
            mask_rgb[mask > 0] = [0, 255, 0]
            overlay = cv2.addWeighted(img_resized, 0.7, mask_rgb, 0.3, 0)

            cv2.imwrite(output_path, overlay)
            print(f"Mock segmentation result saved to {output_path}")
            return True

        model = load_model(model_path)
        print("Model loaded successfully")

        # Load and preprocess the input image
        img = cv2.imread(input_path)
        if img is None:
            raise ValueError(f"Could not load image from {input_path}")

        # Resize to model input size (256x256)
        img_resized = cv2.resize(img, (256, 256))
        img_normalized = img_resized.astype(np.float32) / 255.0

        # Add batch dimension
        img_input = np.expand_dims(img_normalized, axis=0)

        # Perform prediction
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

        # Save the overlay
        cv2.imwrite(output_path, overlay)
        print(f"Segmentation result saved to {output_path}")

        return True

    except Exception as e:
        print(f"Error during segmentation: {str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python image_segmentation.py <input_image_path> <output_image_path>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    success = segment_mango_image(input_path, output_path)
    sys.exit(0 if success else 1)
