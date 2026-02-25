import os
import tensorflow as tf

MODEL_PATH = '/Users/britto/Documents/Lung Disease Project/lung-disease-ai/model/lung_model_multi.h5'

def inspect_model():
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model file not found at {MODEL_PATH}")
        return

    print("Loading model for inspection...")
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        print("\n=== Model Summary ===")
        model.summary()
        
        print("\n=== Layer Details ===")
        for i, layer in enumerate(model.layers):
            print(f"Layer {i}: {layer.name} ({layer.__class__.__name__})")
            if hasattr(layer, 'input_shape'):
                print(f"  Input Shape: {layer.input_shape}")
            if hasattr(layer, 'output_shape'):
                print(f"  Output Shape: {layer.output_shape}")
            print("-" * 30)

    except Exception as e:
        print(f"Error loading model: {e}")

if __name__ == "__main__":
    inspect_model()
