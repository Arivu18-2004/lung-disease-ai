import tensorflow as tf
import os

MODEL_PATH = '/Users/britto/Documents/Lung Disease Project/lung-disease-ai/model/lung_model_multi.h5'

def list_internal_layers():
    if not os.path.exists(MODEL_PATH):
        print("Model non found")
        return
    
    model = tf.keras.models.load_model(MODEL_PATH)
    base_model = model.layers[0]
    
    print(f"Base Model: {base_model.name}")
    for i, layer in enumerate(base_model.layers):
        if 'Conv' in layer.__class__.__name__ or 'ReLU' in layer.__class__.__name__:
             print(f"Layer {i}: {layer.name} ({layer.__class__.__name__})")

if __name__ == "__main__":
    list_internal_layers()
