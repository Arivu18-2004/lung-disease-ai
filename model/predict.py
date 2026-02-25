"""
model/predict.py — Prediction & Grad-CAM Utilities
Lung Disease Detection AI System

Provides:
  - predict_xray(image_path) → dict with prediction, confidence, severity
  - generate_gradcam(image_path, save_path) → heatmap image path

Severity mapping (for Pneumonia only):
  confidence >= 85%  → Severe
  65% <= conf < 85%  → Moderate
  conf < 65%         → Mild
"""
import os
import numpy as np

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import tensorflow as tf
from tensorflow.keras.preprocessing import image as keras_image
import cv2
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from model.medical_insights import get_medical_advice, compute_clinical_risk

# ── Constants ─────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MODEL_PATH  = os.path.join(BASE_DIR, 'model', 'lung_model_multi.h5')
IMG_SIZE    = (224, 224)
CLASS_NAMES = ['COVID19', 'NORMAL', 'PNEUMONIA', 'TUBERCULOSIS']

# Global model cache (load once)
_model = None


def load_model():
    """Load the Keras model from disk (cached after first load)."""
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            return None
        _model = tf.keras.models.load_model(MODEL_PATH)
    return _model


def preprocess_image(image_path):
    """
    Loads and preprocesses an image for CNN input.
    Returns numpy array of shape (1, 224, 224, 3).
    """
    img = keras_image.load_img(image_path, target_size=IMG_SIZE, color_mode='rgb')
    img_array = keras_image.img_to_array(img)
    # MobileNetV2 expects input in range [-1, 1]
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    img_array = np.expand_dims(img_array, 0)   # Add batch dimension
    return img_array


def get_severity(prediction_label, confidence):
    """
    Returns severity level based on prediction and confidence score.
    Only Pneumonia cases get severity classification.
    """
    if prediction_label == 'NORMAL':
        return 'N/A'
    pct = confidence * 100
    if pct >= 85:
        return 'Severe'
    elif pct >= 65:
        return 'Moderate'
    else:
        return 'Mild'


def predict_xray(image_path):
    """
    Run CNN inference on a chest X-ray image.

    Args:
        image_path (str): Absolute path to the image file.

    Returns:
        dict: {
            'prediction':  'NORMAL', 'PNEUMONIA', 'COVID19', or 'TUBERCULOSIS',
            'confidence':  float (0.0 – 1.0),
            'confidence_pct': float (0 – 100),
            'severity':    'N/A' / 'Mild' / 'Moderate' / 'Severe',
            'demo_mode':   bool (True if model not found)
        }
    """
    model = load_model()

    # ── Demo mode (no model file) ──────────────────────────────────────────────
    if model is None:
        import random
        conf        = random.uniform(0.60, 0.98)
        label       = random.choice(CLASS_NAMES)
        probs       = {name: round(random.uniform(0.01, 0.1), 4) for name in CLASS_NAMES}
        probs[label] = round(conf, 4)
        
        # Normalize mock probs
        total = sum(probs.values())
        probs = {k: round(v/total, 4) for k, v in probs.items()}
        
        severity = get_severity(label, conf)
        advice = get_medical_advice(label, severity)
        risk = compute_clinical_risk(label, conf * 100, severity)

        return {
            'prediction':     label,
            'confidence':     round(conf, 4),
            'confidence_pct': round(conf * 100, 2),
            'severity':       severity,
            'probabilities':  probs,
            'medical_info':   advice,
            'risk':           risk,
            'demo_mode':      True
        }

    # ── Real inference ─────────────────────────────────────────────────────────
    img_array  = preprocess_image(image_path)
    predictions = model.predict(img_array, verbose=0)[0]
    class_idx   = np.argmax(predictions)
    label       = CLASS_NAMES[class_idx]
    confidence  = float(predictions[class_idx])
    
    # Full probability vector
    probs_dict = {CLASS_NAMES[i]: float(predictions[i]) for i in range(len(CLASS_NAMES))}
    
    # Get medical info
    severity = get_severity(label, confidence)
    advice = get_medical_advice(label, severity)
    risk = compute_clinical_risk(label, confidence * 100, severity)

    return {
        'prediction':     label,
        'confidence':     round(confidence, 4),
        'confidence_pct': round(confidence * 100, 2),
        'severity':       severity,
        'probabilities':  probs_dict,
        'medical_info':   advice,
        'risk':           risk,
        'demo_mode':      False
    }


def generate_gradcam(image_path, save_path):
    """
    Generates a Grad-CAM heatmap overlay for explainability.

    Args:
        image_path (str): Path to input X-ray image.
        save_path  (str): Path to save the heatmap PNG.

    Returns:
        str | None: save_path if successful, else None.
    """
    model = load_model()
    if model is None:
        return None

    try:
        img_array = preprocess_image(image_path)

        # Find last Conv2D layer (searching recursively if needed)
        last_conv_layer = None
        
        # Traverse top-level model
        for layer in reversed(model.layers):
            if isinstance(layer, tf.keras.layers.Conv2D):
                last_conv_layer = layer.name
                break
            # If layer is a model itself (e.g., MobileNetV2 base)
            if hasattr(layer, 'layers'):
                for sub_layer in reversed(layer.layers):
                    if isinstance(sub_layer, tf.keras.layers.Conv2D):
                        last_conv_layer = sub_layer.name
                        break
                if last_conv_layer:
                    break

        if last_conv_layer is None:
            return None

        # Build Grad-CAM model by splitting the base and head to ensure a connected graph
        base_model = model.layers[0]
        
        # 1. Base model to target layer and base output
        try:
            target_layer = base_model.get_layer(last_conv_layer)
        except ValueError:
            return None
            
        # 2. Reconstruct the head model (all layers after the base model)
        head_layers = model.layers[1:]
        
        with tf.GradientTape() as tape:
            # We must use the base_model.input explicitly to ensure connection
            # Model to get the target convolution output and the base model's final output
            grad_base_model = tf.keras.models.Model(
                inputs=base_model.inputs,
                outputs=[target_layer.output, base_model.output]
            )
            
            # Forward pass
            conv_outputs, base_output = grad_base_model(img_array)
            
            # Pass base_output through the head layers
            x = base_output
            for layer in head_layers:
                x = layer(x)
            predictions = x
            
            predicted_class_idx = tf.argmax(predictions[0])
            loss = predictions[:, predicted_class_idx]

        # Compute gradients of the loss w.r.t. the conv feature map
        grads  = tape.gradient(loss, conv_outputs)
        pooled = tf.reduce_mean(grads, axis=(0, 1, 2))  # Global average pooling

        # Weighted combination of filters
        conv_outputs = conv_outputs[0]
        heatmap = conv_outputs @ pooled[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)

        # Normalize heatmap to [0, 1]
        heatmap = tf.maximum(heatmap, 0) / (tf.reduce_max(heatmap) + 1e-8)
        heatmap = heatmap.numpy()

        # Resize heatmap to image size
        orig_img = cv2.imread(image_path)
        orig_img = cv2.resize(orig_img, IMG_SIZE)
        heatmap_resized = cv2.resize(heatmap, IMG_SIZE)

        # Apply colormap and overlay
        heatmap_colored = cv2.applyColorMap(
            np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET
        )
        superimposed = cv2.addWeighted(orig_img, 0.6, heatmap_colored, 0.4, 0)

        # Save heatmap image
        cv2.imwrite(save_path, superimposed)
        return save_path

    except Exception as exc:
        print(f"[Grad-CAM] Error: {exc}")
        return None
