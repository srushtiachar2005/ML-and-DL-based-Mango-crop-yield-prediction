import os
import numpy as np
import cv2
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Conv2D, MaxPooling2D, UpSampling2D, concatenate
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint
import matplotlib.pyplot as plt

# Paths
dataset_path = "Mango dataset/MangoNet Dataset"
train_original_path = os.path.join(dataset_path, "Train_data", "original images")
train_annotated_path = os.path.join(dataset_path, "Train_data", "annotated images")
test_original_path = os.path.join(dataset_path, "Test_data", "original images")
test_annotated_path = os.path.join(dataset_path, "Test_data", "annotated images")

# Image size
IMG_HEIGHT = 224
IMG_WIDTH = 224
IMG_CHANNELS = 3

# Load images and masks
def load_data(original_path, annotated_path):
    images = []
    masks = []
    for img_file in os.listdir(original_path):
        if img_file.endswith('.JPG'):
            img_path = os.path.join(original_path, img_file)
            ann_file = img_file.replace('IMG_', 'Class_').replace('.JPG', '.jpg')
            ann_path = os.path.join(annotated_path, ann_file)
            if os.path.exists(ann_path):
                img = cv2.imread(img_path)
                img = cv2.resize(img, (IMG_WIDTH, IMG_HEIGHT))
                img = img / 255.0
                images.append(img)

                mask = cv2.imread(ann_path)
                mask = cv2.resize(mask, (IMG_WIDTH, IMG_HEIGHT))
                # Convert to binary: green channel > 128 as mango
                mask = (mask[:, :, 1] > 128).astype(np.uint8)
                # Optional alternative using grayscale thresholding:
                # gray = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
                # _, bin_mask = cv2.threshold(gray, 128, 1, cv2.THRESH_BINARY)
                # mask = bin_mask.astype(np.uint8)
                masks.append(mask)
    return np.array(images), np.array(masks)

# Load train and test
X_train, y_train = load_data(train_original_path, train_annotated_path)
X_test, y_test = load_data(test_original_path, test_annotated_path)

# Expand mask dimensions and convert to float32 for Keras compatibility
y_train = np.expand_dims(y_train, axis=-1).astype('float32')
y_test = np.expand_dims(y_test, axis=-1).astype('float32')

print(f"Train images: {X_train.shape}, Train masks: {y_train.shape}")
print(f"Test images: {X_test.shape}, Test masks: {y_test.shape}")
print(f"After expanding dims: y_train shape = {y_train.shape}, y_test shape = {y_test.shape}")

# U-Net model
def unet_model(input_size=(IMG_HEIGHT, IMG_WIDTH, IMG_CHANNELS)):
    inputs = Input(input_size)

    # Encoder
    c1 = Conv2D(64, (3, 3), activation='relu', padding='same')(inputs)
    c1 = Conv2D(64, (3, 3), activation='relu', padding='same')(c1)
    p1 = MaxPooling2D((2, 2))(c1)

    c2 = Conv2D(128, (3, 3), activation='relu', padding='same')(p1)
    c2 = Conv2D(128, (3, 3), activation='relu', padding='same')(c2)
    p2 = MaxPooling2D((2, 2))(c2)

    c3 = Conv2D(256, (3, 3), activation='relu', padding='same')(p2)
    c3 = Conv2D(256, (3, 3), activation='relu', padding='same')(c3)
    p3 = MaxPooling2D((2, 2))(c3)

    c4 = Conv2D(512, (3, 3), activation='relu', padding='same')(p3)
    c4 = Conv2D(512, (3, 3), activation='relu', padding='same')(c4)
    p4 = MaxPooling2D((2, 2))(c4)

    c5 = Conv2D(1024, (3, 3), activation='relu', padding='same')(p4)
    c5 = Conv2D(1024, (3, 3), activation='relu', padding='same')(c5)

    # Decoder
    u6 = UpSampling2D((2, 2))(c5)
    u6 = concatenate([u6, c4])
    c6 = Conv2D(512, (3, 3), activation='relu', padding='same')(u6)
    c6 = Conv2D(512, (3, 3), activation='relu', padding='same')(c6)

    u7 = UpSampling2D((2, 2))(c6)
    u7 = concatenate([u7, c3])
    c7 = Conv2D(256, (3, 3), activation='relu', padding='same')(u7)
    c7 = Conv2D(256, (3, 3), activation='relu', padding='same')(c7)

    u8 = UpSampling2D((2, 2))(c7)
    u8 = concatenate([u8, c2])
    c8 = Conv2D(128, (3, 3), activation='relu', padding='same')(u8)
    c8 = Conv2D(128, (3, 3), activation='relu', padding='same')(c8)

    u9 = UpSampling2D((2, 2))(c8)
    u9 = concatenate([u9, c1])
    c9 = Conv2D(64, (3, 3), activation='relu', padding='same')(u9)
    c9 = Conv2D(64, (3, 3), activation='relu', padding='same')(c9)

    outputs = Conv2D(1, (1, 1), activation='sigmoid')(c9)

    model = Model(inputs=[inputs], outputs=[outputs])
    model.compile(optimizer=Adam(learning_rate=1e-4), loss='binary_crossentropy', metrics=['accuracy'])
    return model

model = unet_model()
model.summary()

# Train
checkpoint = ModelCheckpoint('mango_segmentation_model.h5', save_best_only=True, monitor='val_loss', mode='min')
history = model.fit(X_train, y_train, validation_data=(X_test, y_test), batch_size=4, epochs=50, callbacks=[checkpoint])

# Plot history
plt.plot(history.history['loss'], label='train_loss')
plt.plot(history.history['val_loss'], label='val_loss')
plt.legend()
plt.show()

print("Segmentation model trained and saved as mango_segmentation_model.h5")
