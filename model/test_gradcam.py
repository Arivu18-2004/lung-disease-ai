import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from model.predict import predict_xray, generate_gradcam

def test_gradcam():
    # Sample image from training set
    sample_img = '/Users/britto/Documents/Lung Disease Project/lung-disease-ai/data/chest_xray_multi/train/COVID19/COVID19(0).jpg'
    save_path = '/Users/britto/Documents/Lung Disease Project/lung-disease-ai/static/heatmaps/test_heatmap.png'
    
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    print(f"Running prediction on: {sample_img}")
    result = predict_xray(sample_img)
    print(f"Prediction: {result['prediction']} ({result['confidence_pct']}%)")
    
    print("Generating Grad-CAM...")
    cam_path = generate_gradcam(sample_img, save_path)
    
    if cam_path:
        print(f"SUCCESS! Heatmap saved to: {cam_path}")
    else:
        print("FAILED to generate Grad-CAM.")

if __name__ == "__main__":
    test_gradcam()
