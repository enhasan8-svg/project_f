import os

filepath = r"c:\Users\hp\Desktop\project_f\project_f\static\stt.css"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    # Backgrounds
    "#140e1a": "#020003", 
    "linear-gradient(135deg, #140e1a, #261b36, #3b2a4d)": "linear-gradient(135deg, #020003, #5f1194, #b601bb)",
    
    # Upload section background
    "rgba(49, 36, 66, 0.85)": "rgba(95, 17, 148, 0.65)",
    "rgba(63, 46, 84, 0.90)": "rgba(21, 69, 237, 0.65)",
    
    # Nav indicator
    "linear-gradient(45deg, #4b3663, #7a5a9c)": "linear-gradient(45deg, #1545ed, #b601bb)",
    "linear-gradient(45deg, #3e2d52, #684a87)": "linear-gradient(45deg, #5f1194, #1545ed)",
    
    # Nav Links Background
    "rgba(102, 79, 130, 0.45)": "rgba(95, 17, 148, 0.45)",
    "rgba(43, 31, 56, 0.82)": "rgba(2, 0, 3, 0.82)",
    
    # Buttons
    "#755a96": "#5f1194",
    "#8b6cb0": "#b601bb",
    "#5c447a": "#1545ed",
    "#7a5c9e": "#5f1194",
    
    # Gradients for Tabs & Highlights
    "linear-gradient(135deg, #8b6cb0, #a98acc)": "linear-gradient(135deg, #1545ed, #b601bb)",
    "linear-gradient(90deg, #a98acc, #8b6cb0)": "linear-gradient(90deg, #b601bb, #1545ed)",
    
    # Borders and dashes
    "#9678bd": "#b601bb",
    
    # Glows
    "rgba(139, 108, 176, 0.2)": "rgba(21, 69, 237, 0.2)",
    "rgba(139, 108, 176, 0.4)": "rgba(21, 69, 237, 0.4)",
    "rgba(169, 138, 204, 0.4)": "rgba(182, 1, 187, 0.4)",
    "rgba(169, 138, 204, 0.8)": "rgba(182, 1, 187, 0.8)",
    "rgba(139, 108, 176, 0.6)": "rgba(21, 69, 237, 0.6)",
    "rgba(169, 138, 204, 0.35)": "rgba(182, 1, 187, 0.35)",
    "radial-gradient(circle, #e9e1f2 0%, #9e7bc2 45%, #4c3761 100%)": "radial-gradient(circle, #b601bb 0%, #1545ed 45%, #5f1194 100%)",
    
    # About Modal Popup
    "linear-gradient(135deg, rgba(30, 22, 41, 0.92), rgba(53, 38, 71, 0.88))": "linear-gradient(135deg, rgba(2, 0, 3, 0.92), rgba(95, 17, 148, 0.88))",
    "rgba(36, 27, 48, 0.85)": "rgba(2, 0, 3, 0.85)",
    "rgba(50, 36, 66, 0.95)": "rgba(95, 17, 148, 0.80)",
    
    # Circle shape
    "linear-gradient(135deg, #533b70, #2c1f3d)": "linear-gradient(135deg, #1545ed, #5f1194)"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Palette applied successfully.")
