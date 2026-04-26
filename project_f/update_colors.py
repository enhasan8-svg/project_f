import os

filepath = r"c:\Users\hp\Desktop\project_f\project_f\static\stt.css"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    # Backgrounds
    "#1a0f24": "#140e1a", # Darker, elegant base
    "linear-gradient(135deg, #1a0f24, #32153f, #4a1d63)": "linear-gradient(135deg, #140e1a, #261b36, #3b2a4d)",
    
    # Upload section background
    "rgba(78, 11, 104, 0.75)": "rgba(49, 36, 66, 0.85)",
    "rgba(105, 28, 126, 0.82)": "rgba(63, 46, 84, 0.90)",
    
    # Nav indicator
    "linear-gradient(45deg, #5a1e6b, #9a58b1)": "linear-gradient(45deg, #4b3663, #7a5a9c)",
    "linear-gradient(45deg, #4b1d61, #7b35a0)": "linear-gradient(45deg, #3e2d52, #684a87)",
    
    # Nav Links Background
    "rgba(138, 69, 160, 0.55)": "rgba(102, 79, 130, 0.45)",
    "rgba(55, 22, 73, 0.78)": "rgba(43, 31, 56, 0.82)",
    
    # Buttons
    "#9b56b2": "#755a96",
    "#b166ca": "#8b6cb0",
    "#6d2f88": "#5c447a",
    "#8a44aa": "#7a5c9e",
    
    # Gradients for Tabs & Highlights
    "linear-gradient(135deg, #a855f7, #d946ef)": "linear-gradient(135deg, #8b6cb0, #a98acc)",
    "linear-gradient(90deg, #d946ef, #a855f7)": "linear-gradient(90deg, #a98acc, #8b6cb0)",
    
    # Borders and dashes
    "#a56af0": "#9678bd",
    
    # Glows
    "rgba(168, 85, 247, 0.15)": "rgba(139, 108, 176, 0.2)",
    "rgba(168, 85, 247, 0.35)": "rgba(139, 108, 176, 0.4)",
    "rgba(217, 70, 239, 0.4)": "rgba(169, 138, 204, 0.4)",
    "rgba(217, 70, 239, 0.8)": "rgba(169, 138, 204, 0.8)",
    "rgba(168, 85, 247, 0.6)": "rgba(139, 108, 176, 0.6)",
    "rgba(236, 72, 153, 0.35)": "rgba(169, 138, 204, 0.35)",
    
    # About Modal Popup
    "linear-gradient(135deg, rgba(33, 14, 46, 0.88), rgba(76, 35, 97, 0.82))": "linear-gradient(135deg, rgba(30, 22, 41, 0.92), rgba(53, 38, 71, 0.88))",
    "rgba(38, 18, 52, 0.85)": "rgba(36, 27, 48, 0.85)",
    "rgba(58, 28, 78, 0.95)": "rgba(50, 36, 66, 0.95)",
    
    # Circle shape
    "linear-gradient(135deg, #5a247b, #3b1155)": "linear-gradient(135deg, #533b70, #2c1f3d)"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Colors updated successfully.")
