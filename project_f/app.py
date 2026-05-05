import os
import uuid

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.transforms as transforms
from flask import Flask, jsonify, render_template, request
from PIL import Image, ImageChops, ImageEnhance

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
   

def generate_ela(img_path, quality=90):
    try:
                # 1. فتح الصورة الأصلية
        original = Image.open(img_path).convert('RGB')

                # 2. حفظ نسخة جديدة بجودة 90%
        temp_filename = img_path + ".temp.jpg"
        original.save(temp_filename, 'JPEG', quality=quality)
        resaved = Image.open(temp_filename).convert('RGB')
        # 3. حساب الفرق بين الأصلية والنسخة المحفوظة

        diff = ImageChops.difference(original, resaved)
                # 4. توضيح الفروقات باش تبان للعين (تعزيز الإضاءة)

        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        if max_diff == 0:
            max_diff = 1
        scale = 255.0 / max_diff
        
        ela_image = ImageEnhance.Brightness(diff).enhance(scale)
        
        import numpy as np
        diff_gray = np.array(diff.convert('L'))
        ela_variance = np.var(diff_gray)
        ela_max = np.max(diff_gray)
        ela_mean = np.mean(diff_gray)
        ela_ratio = ela_max / (ela_mean + 1e-5)
        
        # Independent ELA decision logic based on image compression variance
        if ela_max > 12 and ela_ratio > 10:
            ela_text = f"High variance in compression levels detected (Max Diff: {ela_max}). This is a strong indicator that the image has been spliced or manipulated. [MANIPULATED]"
        elif ela_max > 8 or ela_variance > 1.0:
            ela_text = f"Minor structural anomalies detected at pixel boundaries. This image may have undergone partial modification or resaving. [MANIPULATED]"
        else:
            ela_text = f"Uniform compression variance across the image. No pixel-level manipulation traces were found. [AUTHENTIC]"
            
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
            
        return ela_image, ela_text
    except Exception as e:
        print("Error in ELA:", e)
        return None, "[ERROR_LEVEL_ANALYSIS] Failed to extract error levels."

@app.route("/")
def index():
    return render_template("index.html")

# Load OpenCV DNN Face Detector
prototxt_path = os.path.join(BASE_DIR, "deploy.prototxt")
model_path = os.path.join(BASE_DIR, "res10.caffemodel")
face_net = cv2.dnn.readNetFromCaffe(prototxt_path, model_path)

def get_faces(img_path):
    raw_img = cv2.imread(img_path)
    (h, w) = raw_img.shape[:2]
    
    blob = cv2.dnn.blobFromImage(cv2.resize(raw_img, (300, 300)), 1.0, (300, 300), (104.0, 177.0, 123.0))
    face_net.setInput(blob)
    detections = face_net.forward()
    
    faces_boxes = []
    for i in range(0, detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        
        # Threshold lowered to 0.5 to catch the 5th face, but size checked to avoid concrete
        if confidence > 0.5:
            box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
            (startX, startY, endX, endY) = box.astype("int")
            
            box_w = endX - startX
            box_h = endY - startY
            
            if box_w < 40 or box_h < 40:
                continue
                
            # Make the crop perfectly square
            center_x = startX + box_w // 2
            center_y = startY + box_h // 2
            side = max(box_w, box_h)
            
            # Standard expansion for face deepfake models is usually ~1.2x
            side = int(side * 1.2)
            
            # Ensure the crop box stays entirely within the image to avoid black padding
            # which strongly triggers 'Fake' predictions in CNNs
            max_side_x = min(center_x, w - center_x) * 2
            max_side_y = min(center_y, h - center_y) * 2
            side = min(side, max_side_x, max_side_y)
            
            x1 = center_x - side // 2
            y1 = center_y - side // 2
            x2 = center_x + side // 2
            y2 = center_y + side // 2
            
            faces_boxes.append([x1, y1, side, side])
                
    return faces_boxes, raw_img

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

    faces_boxes, raw_img = get_faces(img_path)
    
    if len(faces_boxes) == 0:
        # No faces detected, return error immediately
        os.remove(img_path) # Clean up
        return jsonify({"error": "لم يتم اكتشاف أي وجه بشري في الصورة. يرجى رفع صورة واضحة لشخص."})
    
    pil_full_img = Image.open(img_path).convert("RGB")
    width, height = pil_full_img.size
    
    faces_results = []
    
    # Draw boxes for info image
    info_img = raw_img.copy()

    for idx, (x, y, w_box, h_box) in enumerate(faces_boxes):
        x1, y1 = x, y
        x2, y2 = x + w_box, y + h_box
        
        if len(faces_boxes) > 1 or (w_box < raw_img.shape[1] * 0.9):
            cv2.rectangle(info_img, (x1, y1), (x2, y2), (255, 0, 0), 3)
            cv2.putText(info_img, f"Face {idx+1}", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255,0,0), 2)
        
        # Crop face
        face_img_cv = raw_img[y1:y2, x1:x2]
        face_img_pil = pil_full_img.crop((x1, y1, x2, y2))
        
        face_filename = f"{unique_id}_face_{idx+1}.jpg"
        face_path = os.path.join(RESULTS_FOLDER, face_filename)
        face_img_pil.save(face_path)
        
        # Predict
        pred_input_tensor = preprocess_pil_image(face_img_pil, requires_grad=False)
        label, confidence_val, pred_idx, prob_real = predict_with_model(pred_input_tensor)
        
        # Grad-CAM
        cam_input_tensor = preprocess_pil_image(face_img_pil, requires_grad=True)
        cam_img, heatmap_img = generate_gradcam(cam_input_tensor, face_img_cv, pred_idx)
        
        cam_name = f"cam_{face_filename}"
        heatmap_name = f"heatmap_{face_filename}"
        
        cv2.imwrite(os.path.join(RESULTS_FOLDER, cam_name), cam_img)
        cv2.imwrite(os.path.join(RESULTS_FOLDER, heatmap_name), heatmap_img)
        
        # ELA
        ela_img, ela_text = generate_ela(face_path)
        ela_name = f"ela_{face_filename}"
        if ela_img:
            ela_img.save(os.path.join(RESULTS_FOLDER, ela_name))
            
        faces_results.append({
            "face_id": idx + 1,
            "cropped_url": f"/static/results/{face_filename}",
            "result": label,
            "confidence": f"{confidence_val:.4f}",
            "score": f"{prob_real:.4f}",
            "gradcam_url": f"/static/results/{cam_name}",
            "heatmap_url": f"/static/results/{heatmap_name}",
            "ela_url": f"/static/results/{ela_name}" if ela_img else "",
            "ela_analysis": ela_text
        })
        
    info_img_name = f"info_{img_name}"
    cv2.imwrite(os.path.join(RESULTS_FOLDER, info_img_name), info_img)

    size_mb = os.path.getsize(img_path) / (1024 * 1024)
    
    return jsonify({
        "image_info": {
            "dimensions": f"{width}x{height}",
            "size": f"{size_mb:.2f} MB",
            "format": pil_full_img.format or "JPEG",
            "faces_detected": len(faces_results),
            "info_image_url": f"/static/results/{info_img_name}",
            "original_url": f"/static/uploads/{img_name}"
        },
        "faces": faces_results
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)