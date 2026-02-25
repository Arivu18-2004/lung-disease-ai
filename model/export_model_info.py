import os
import tensorflow as tf

MODEL_PATH = '/Users/britto/Documents/Lung Disease Project/lung-disease-ai/model/lung_model.h5'
EXPORT_PATH = '/Users/britto/Documents/Lung Disease Project/lung-disease-ai/model/model_architecture.md'

def export_to_markdown():
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model file not found.")
        return

    print("Loading model for export...")
    model = tf.keras.models.load_model(MODEL_PATH)
    
    with open(EXPORT_PATH, 'w') as f:
        f.write("# Lung Disease Detection AI - Model Architecture\n\n")
        f.write("This file is a human-readable representation of the binary `lung_model.h5` file.\n\n")
        
        f.write("## 🏗️ Architecture Overview\n")
        f.write(f"- **Total Parameters:** {model.count_params():,}\n")
        f.write(f"- **Input Size:** {model.input_shape}\n")
        f.write(f"- **Output:** Binary Classification (Sigmoid)\n\n")
        
        f.write("## 📋 Layer-by-Layer Breakdown\n\n")
        f.write("| Layer # | Name | Type | Output Shape | Parameters |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- |\n")
        
        total_params = 0
        for i, layer in enumerate(model.layers):
            params = layer.count_params()
            total_params += params
            f.write(f"| {i} | {layer.name} | {layer.__class__.__name__} | {layer.output_shape} | {params:,} |\n")
            
        f.write(f"\n**Total Trainable Parameters:** {sum([tf.keras.backend.count_params(w) for w in model.trainable_weights]):,}\n")
        
        f.write("\n## 🧬 Detailed Configuration\n")
        f.write("```json\n")
        f.write(model.to_json(indent=4))
        f.write("\n```\n")

    print(f"✅ Exported readable model info to: {EXPORT_PATH}")

if __name__ == "__main__":
    export_to_markdown()
