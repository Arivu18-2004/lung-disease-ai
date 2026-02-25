"""
model/train_model.py — Optimized CNN Training Script
Lung Disease Detection AI System

Changes:
1. Transfer Learning: Using MobileNetV2 pre-trained on ImageNet.
2. Class Weights: Handling the 3:1 imbalance (Pneumonia vs Normal).
3. Data Augmentation: Added brightness variation.
4. Learning Rate: Lowered to 1e-4 for stable fine-tuning.
"""
import os
import sys
import numpy as np

# Suppress TensorFlow info messages
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.applications import MobileNetV2
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt

# ── Configuration ─────────────────────────────────────────────────────────────
BASE_DIR   = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_DIR   = os.path.join(BASE_DIR, 'data', 'chest_xray')
MODEL_PATH = os.path.join(BASE_DIR, 'model', 'lung_model.h5')

IMG_SIZE   = (224, 224)
BATCH_SIZE = 32
EPOCHS     = 30  # Increased epochs since we have early stopping
SEED       = 42


# ── Optimized CNN Model (Transfer Learning) ───────────────────────────────────
def build_model():
    """
    Builds an optimized model using MobileNetV2 as a base.
    """
    # Load MobileNetV2 pre-trained on ImageNet
    base_model = MobileNetV2(
        weights='imagenet', 
        include_top=False, 
        input_shape=(*IMG_SIZE, 3)
    )
    
    # Initially freeze the base model
    base_model.trainable = False

    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dense(512, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.5), # High dropout to prevent overfitting
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(1, activation='sigmoid')
    ])
    
    return model, base_model


# ── Data Generators with Enhanced Augmentation ────────────────────────────────
def get_generators():
    """
    Creates ImageDataGenerators with enhanced augmentation for training.
    """
    train_datagen = ImageDataGenerator(
        # MobileNetV2 expects input in range [-1, 1], so we use its preprocess_input
        preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input,
        rotation_range     = 10,  # X-rays shouldn't rotate too much
        width_shift_range   = 0.1,
        height_shift_range  = 0.1,
        shear_range        = 0.1,
        zoom_range         = 0.2,
        brightness_range   = [0.8, 1.2], # Handle lighting variations
        horizontal_flip    = True,
        fill_mode          = 'nearest'
    )

    val_datagen = ImageDataGenerator(
        preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input
    )

    train_dir = os.path.join(DATA_DIR, 'val')
    val_dir   = os.path.join(DATA_DIR, 'test')

    if not os.path.exists(train_dir):
        print(f"[ERROR] Training data not found at: {train_dir}")
        sys.exit(1)

    train_gen = train_datagen.flow_from_directory(
        train_dir,
        target_size = IMG_SIZE,
        batch_size  = BATCH_SIZE,
        class_mode  = 'binary',
        seed        = SEED
    )

    val_gen = val_datagen.flow_from_directory(
        val_dir,
        target_size = IMG_SIZE,
        batch_size  = BATCH_SIZE,
        class_mode  = 'binary',
        shuffle     = False
    )

    return train_gen, val_gen


# ── Training ──────────────────────────────────────────────────────────────────
def train():
    print("=" * 60)
    print("  Optimized Lung Disease Detection — Training Started")
    print("=" * 60)

    # 1. Load data
    train_gen, val_gen = get_generators()

    # 2. Calculate Class Weights Dynamically
    classes = train_gen.classes
    from collections import Counter
    counts = Counter(classes)
    count_normal = counts[0]
    count_pneumonia = counts[1]
    total = count_normal + count_pneumonia
    
    # Avoid division by zero
    weight_for_0 = (1 / count_normal) * (total / 2.0) if count_normal > 0 else 1.0
    weight_for_1 = (1 / count_pneumonia) * (total / 2.0) if count_pneumonia > 0 else 1.0
    class_weight = {0: weight_for_0, 1: weight_for_1}
    
    print(f"Data counts: Normal={count_normal}, Pneumonia={count_pneumonia}")
    print(f"Computed Class Weights: Normal={weight_for_0:.2f}, Pneumonia={weight_for_1:.2f}")

    # 3. Build and compile model
    model, base_model = build_model()
    
    # Phase 1: Train Top Layers
    print("\nPhase 1: Training top layers...")
    model.compile(
        optimizer = tf.keras.optimizers.Adam(learning_rate=0.001),
        loss      = 'binary_crossentropy',
        metrics   = ['accuracy', tf.keras.metrics.AUC(name='auc')]
    )

    callbacks = [
        ModelCheckpoint(MODEL_PATH, monitor='val_accuracy', save_best_only=True, verbose=1),
        EarlyStopping(monitor='val_loss', patience=6, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=3, verbose=1)
    ]

    history1 = model.fit(
        train_gen,
        validation_data = val_gen,
        epochs          = 10,
        class_weight    = class_weight,
        callbacks       = callbacks,
        verbose         = 1
    )

    # Phase 2: Fine-Tuning (Unfreeze later layers of base model)
    print("\nPhase 2: Fine-tuning the base model...")
    base_model.trainable = True
    # Freeze the first 100 layers (keep them frozen)
    for layer in base_model.layers[:100]:
        layer.trainable = False

    model.compile(
        optimizer = tf.keras.optimizers.Adam(learning_rate=0.0001), # Lower LR for fine-tuning
        loss      = 'binary_crossentropy',
        metrics   = ['accuracy', tf.keras.metrics.AUC(name='auc')]
    )

    history2 = model.fit(
        train_gen,
        validation_data = val_gen,
        epochs          = 20,
        class_weight    = class_weight,
        callbacks       = callbacks,
        verbose         = 1
    )

    # Plot results
    _plot_history(history1, history2)

    print(f"\n✅ Optimized model saved to: {MODEL_PATH}")
    return model


def _plot_history(h1, h2):
    """Combines histories and plots them."""
    acc = h1.history['accuracy'] + h2.history['accuracy']
    val_acc = h1.history['val_accuracy'] + h2.history['val_accuracy']
    loss = h1.history['loss'] + h2.history['loss']
    val_loss = h1.history['val_loss'] + h2.history['val_loss']

    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    axes[0].plot(acc, label='Train Acc')
    axes[0].plot(val_acc, label='Val Acc')
    axes[0].set_title('Model Accuracy')
    axes[0].legend()

    axes[1].plot(loss, label='Train Loss')
    axes[1].plot(val_loss, label='Val Loss')
    axes[1].set_title('Model Loss')
    axes[1].legend()

    plt.tight_layout()
    plot_path = os.path.join(os.path.dirname(__file__), 'training_history_optimized.png')
    plt.savefig(plot_path)
    print(f"\n📊 Optimized training plots saved to: {plot_path}")


if __name__ == '__main__':
    train()
