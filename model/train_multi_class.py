"""
model/train_multi_class.py — Optimized 4-Class CNN Training Script
Lung Disease Detection AI System

Changes:
1. Multi-Class Classification: 4 classes (COVID19, NORMAL, PNEUMONIA, TUBERCULOSIS).
2. Transfer Learning: Using MobileNetV2 with softmax output (4 units).
3. Class Weights: Handling imbalance across all 4 classes.
4. Data Augmentation: Tailored for X-ray images.
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
# The dataset specified by user: chest_xray_multi
DATA_DIR   = os.path.join(BASE_DIR, 'data', 'chest_xray_multi')
MODEL_PATH = os.path.join(BASE_DIR, 'model', 'lung_model_multi.h5')

IMG_SIZE   = (224, 224)
BATCH_SIZE = 32
EPOCHS     = 30
SEED       = 42

# CLASS_NAMES derived from directory structure
# Expected: ['COVID19', 'NORMAL', 'PNEUMONIA', 'TUBERCULOSIS']

# ── Multi-Class CNN Model (Transfer Learning) ───────────────────────────────────
def build_model(num_classes=4):
    """
    Builds an optimized model for multi-class classification.
    """
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
        layers.Dropout(0.5),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation='softmax') # 4 units, softmax for multi-class
    ])
    
    return model, base_model


# ── Data Generators ────────────────────────────────────────────────────────────
def get_generators():
    """
    Creates ImageDataGenerators for multi-class classification.
    """
    train_datagen = ImageDataGenerator(
        preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input,
        rotation_range     = 10,
        width_shift_range   = 0.1,
        height_shift_range  = 0.1,
        shear_range        = 0.1,
        zoom_range         = 0.2,
        brightness_range   = [0.8, 1.2],
        horizontal_flip    = True,
        fill_mode          = 'nearest'
    )

    val_datagen = ImageDataGenerator(
        preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input
    )

    train_dir = os.path.join(DATA_DIR, 'train')
    val_dir   = os.path.join(DATA_DIR, 'val')
    test_dir  = os.path.join(DATA_DIR, 'test')

    if not os.path.exists(train_dir):
        print(f"[ERROR] Training data not found at: {train_dir}")
        sys.exit(1)

    train_gen = train_datagen.flow_from_directory(
        train_dir,
        target_size = IMG_SIZE,
        batch_size  = BATCH_SIZE,
        class_mode  = 'categorical', # Categorical for softmax
        seed        = SEED
    )

    val_gen = val_datagen.flow_from_directory(
        val_dir,
        target_size = IMG_SIZE,
        batch_size  = BATCH_SIZE,
        class_mode  = 'categorical',
        shuffle     = False
    )

    test_gen = val_datagen.flow_from_directory(
        test_dir,
        target_size = IMG_SIZE,
        batch_size  = BATCH_SIZE,
        class_mode  = 'categorical',
        shuffle     = False
    )

    return train_gen, val_gen, test_gen


# ── Training ──────────────────────────────────────────────────────────────────
def train():
    print("=" * 60)
    print("  Multi-Class Lung Disease Detection — Training")
    print("=" * 60)

    # 1. Load data
    train_gen, val_gen, test_gen = get_generators()
    num_classes = len(train_gen.class_indices)
    print(f"Detected classes: {train_gen.class_indices}")

    # 2. Calculate Class Weights Dynamically
    classes = train_gen.classes
    from collections import Counter
    counts = Counter(classes)
    total = sum(counts.values())
    
    class_weight = {}
    for i in range(num_classes):
        # Balanced weights formula: n_samples / (n_classes * n_samples_j)
        count = counts[i] if counts[i] > 0 else 1
        class_weight[i] = total / (num_classes * count)
    
    print(f"Class counts: {counts}")
    print(f"Computed Class Weights: { {k: f'{v:.2f}' for k, v in class_weight.items()} }")

    # 3. Build and compile model
    model, base_model = build_model(num_classes=num_classes)
    
    # Phase 1: Train Top Layers
    print("\nPhase 1: Training top layers...")
    model.compile(
        optimizer = tf.keras.optimizers.Adam(learning_rate=0.001),
        loss      = 'categorical_crossentropy', # Multi-class loss
        metrics   = ['accuracy']
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

    # Phase 2: Fine-Tuning
    print("\nPhase 2: Fine-tuning the base model...")
    base_model.trainable = True
    for layer in base_model.layers[:100]:
        layer.trainable = False

    model.compile(
        optimizer = tf.keras.optimizers.Adam(learning_rate=0.0001),
        loss      = 'categorical_crossentropy',
        metrics   = ['accuracy']
    )

    history2 = model.fit(
        train_gen,
        validation_data = val_gen,
        epochs          = 20,
        class_weight    = class_weight,
        callbacks       = callbacks,
        verbose         = 1
    )

    # 4. Final Evaluation on Test Set
    print("\nFinal evaluation on test set...")
    test_loss, test_acc = model.evaluate(test_gen)
    print(f"Test Accuracy: {test_acc:.4f}")

    # Plot results
    _plot_history(history1, history2)

    print(f"\n✅ Multi-class model saved to: {MODEL_PATH}")
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
    plot_path = os.path.join(os.path.dirname(__file__), 'training_history_multi.png')
    plt.savefig(plot_path)
    print(f"\n📊 Multi-class training plots saved to: {plot_path}")


if __name__ == '__main__':
    train()
