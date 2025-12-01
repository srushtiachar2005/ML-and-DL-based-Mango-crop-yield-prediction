import sys
import cv2
import numpy as np

def count_mangoes(image_path):
    """
    Count mangoes in the segmented image.
    """
    try:
        # Load the segmented image
        img = cv2.imread(image_path)
        if img is None:
            print("0")
            return

        # Convert to HSV to detect green areas (segmented mangoes)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        # Define range for green color (more precise for segmentation overlay)
        lower_green = np.array([35, 40, 40])
        upper_green = np.array([85, 255, 255])

        # Create mask for green areas
        mask = cv2.inRange(hsv, lower_green, upper_green)

        # Apply morphological operations to clean up the mask
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

        # Find contours with better parameters
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # More sophisticated filtering based on contour properties
        mango_contours = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            perimeter = cv2.arcLength(cnt, True)
            if perimeter == 0:
                continue

            # Calculate circularity (mangoes are roughly circular)
            circularity = 4 * np.pi * area / (perimeter * perimeter)

            # Filter based on area, circularity, and other properties
            if (area > 20 and area < 15000 and  # More flexible area range
                circularity > 0.3 and  # Not too elongated
                len(cnt) > 8):  # Sufficient contour points
                mango_contours.append(cnt)

        # If still low count, try to detect overlapping/touching mangoes using watershed
        if len(mango_contours) < 5 and np.sum(mask > 0) > 2000:
            try:
                # Distance transform for watershed
                dist_transform = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
                _, sure_fg = cv2.threshold(dist_transform, 0.3 * dist_transform.max(), 255, 0)
                sure_fg = np.uint8(sure_fg)

                # Find sure background
                sure_bg = cv2.dilate(mask, kernel, iterations=2)

                # Unknown region
                unknown = cv2.subtract(sure_bg, sure_fg)

                # Marker labelling
                _, markers = cv2.connectedComponents(sure_fg)

                # Add one to all labels so that sure background is not 0, but 1
                markers = markers + 1

                # Mark the unknown region with zero
                markers[unknown == 255] = 0

                # Apply watershed
                markers = cv2.watershed(img, markers)

                # Count unique regions (excluding background and unknown)
                unique_markers = np.unique(markers)
                watershed_count = len([m for m in unique_markers if m > 1])  # Exclude background (1) and unknown (0)

                # Use watershed count if it's significantly higher
                if watershed_count > len(mango_contours) * 1.5:
                    mango_contours = list(range(watershed_count))  # Placeholder list for count
            except Exception as watershed_error:
                print(f"Watershed failed: {watershed_error}", file=sys.stderr)

        print(len(mango_contours))

    except Exception as e:
        print(f"Error counting mangoes: {str(e)}", file=sys.stderr)
        print("0")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python count_mangoes.py <segmented_image_path>", file=sys.stderr)
        sys.exit(1)

    image_path = sys.argv[1]
    count_mangoes(image_path)
