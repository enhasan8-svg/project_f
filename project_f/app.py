import os
import uuid

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.transforms as transforms
from flask import Flask, jsonify, render_template, request
from PIL import Image

from model import CapsuleNet, VggExtractor

app = Flask(__name__)

UPLOAD_FOLDER = "static/uploads"
RESULTS_FOLDER = "static/results"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_PATH = os.path.join(BASE_DIR, "weights", "clean_20_model_epoch_20.pt")

# نفس preprocessing الكود الاول
transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor(),
    transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225)),
])


def load_deep_learning_system():
    if not os.path.exists(WEIGHTS_PATH):
        raise FileNotFoundError(f"Weights file not found: {WEIGHTS_PATH}")

    vgg_ext = VggExtractor().to(device)
    capnet = CapsuleNet(num_class=2, gpu_id=0).to(device)
    capnet.load_state_dict(torch.load(WEIGHTS_PATH, map_location=device))

    vgg_ext.eval()
    capnet.eval()
    print(f"Model weights loaded successfully from: {WEIGHTS_PATH}")
    return vgg_ext, capnet


vgg, model = load_deep_learning_system()




def preprocess_pil_image(pil_img, requires_grad=False):
    input_tensor = transform(pil_img).unsqueeze(0).to(device)
    input_tensor.requires_grad_(requires_grad)
    return input_tensor


def predict_with_model(input_tensor):
    # نفس قرار الكود الاول بدون اي تأثير من Grad-CAM
    with torch.no_grad():
        input_batch = torch.cat([input_tensor, input_tensor], dim=0)
        feats = vgg(input_batch)
        z, _ = model(feats)
        v_lengths = torch.norm(z, p=2, dim=-1)
        probs = F.softmax(v_lengths, dim=1)
        prob_real = probs[0, 1].item()

    prediction = "Real Image" if prob_real > 0.5 else "Fake Image"
    confidence = prob_real if prob_real > 0.5 else 1.0 - prob_real
    pred_idx = 1 if prob_real > 0.5 else 0
    return prediction, confidence, pred_idx, prob_real


def generate_gradcam(input_tensor, original_image, target_class_idx):
    target_layer = vgg.vgg_1[-1]
    
    feature_maps = []
    gradients = []

    def save_feature(module, input, output):
        feature_maps.append(output)

    def save_gradient(module, grad_input, grad_output):
        gradients.append(grad_output[0])

    handle = target_layer.register_forward_hook(save_feature)
    handle_grad = target_layer.register_full_backward_hook(save_gradient)

    input_batch = torch.cat([input_tensor, input_tensor], dim=0)
    feats = vgg(input_batch)
    z, _ = model(feats)
    v_lengths = torch.norm(z, p=2, dim=-1)
    probs = F.softmax(v_lengths, dim=1)

    vgg.zero_grad()
    model.zero_grad()
    probs[0, target_class_idx].backward()

    grads = gradients[0][0].detach().cpu().numpy()
    f_maps = feature_maps[0][0].detach().cpu().numpy()
    weights = np.mean(grads, axis=(1, 2))

    cam = np.zeros(f_maps.shape[1:], dtype=np.float32)
    for i, w in enumerate(weights):
        cam += w * f_maps[i, :, :]

    cam = np.maximum(cam, 0)
    if cam.max() > 0:
        cam = (cam - cam.min()) / (cam.max() - cam.min())
    else:
        cam = np.zeros_like(cam)

    cam_resized = cv2.resize(cam, (original_image.shape[1], original_image.shape[0]))
    heatmap = cv2.applyColorMap(np.uint8(255 * cam_resized), cv2.COLORMAP_JET)
    result_img = cv2.addWeighted(original_image, 0.6, heatmap, 0.4, 0)

    handle.remove()
    handle_grad.remove()
    
    return result_img, heatmap
   


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "لم يتم رفع أي ملف"})

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "اسم الملف فارغ"})

    unique_id = str(uuid.uuid4())
    img_name = unique_id + ".jpg"
    img_path = os.path.join(UPLOAD_FOLDER, img_name)
    file.save(img_path)

    raw_img = cv2.imread(img_path)
    if raw_img is None:
        return jsonify({"error": "فشل في قراءة الصورة المرفوعة"})

    pil_img = Image.open(img_path).convert("RGB")

    pred_input_tensor = preprocess_pil_image(pil_img, requires_grad=False)
    label, confidence_val, pred_idx, prob_real = predict_with_model(pred_input_tensor)

    cam_input_tensor = preprocess_pil_image(pil_img, requires_grad=True)
    cam_img, heatmap_img = generate_gradcam(cam_input_tensor, raw_img, pred_idx)
    cam_name = "cam_" + img_name
    heatmap_name = "heatmap_" + img_name
    
    cam_path = os.path.join(RESULTS_FOLDER, cam_name)
    heatmap_path = os.path.join(RESULTS_FOLDER, heatmap_name)
   
    cv2.imwrite(cam_path, cam_img)
    cv2.imwrite(heatmap_path, heatmap_img)
    
    return jsonify({
        "result": label,
        "confidence": f"{confidence_val:.4f}",
        "score": f"{prob_real:.4f}",
       
        "gradcam_url": f"/static/results/{cam_name}",
        "heatmap_url": f"/static/results/{heatmap_name}",
       
        "original_url": f"/static/uploads/{img_name}",
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)