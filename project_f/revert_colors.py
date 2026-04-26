import os

filepath = r"c:\Users\hp\Desktop\project_f\project_f\static\stt.css"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    # Gradients and complex strings FIRST
    "linear-gradient(135deg, #020003, #5f1194, #b601bb)": "linear-gradient(135deg, #1a0f24, #32153f, #4a1d63)",
    "linear-gradient(45deg, #1545ed, #b601bb)": "linear-gradient(45deg, #5a1e6b, #9a58b1)",
    "linear-gradient(45deg, #5f1194, #1545ed)": "linear-gradient(45deg, #4b1d61, #7b35a0)",
    "linear-gradient(135deg, #1545ed, #b601bb)": "linear-gradient(135deg, #a855f7, #d946ef)",
    "linear-gradient(90deg, #b601bb, #1545ed)": "linear-gradient(90deg, #d946ef, #a855f7)",
    "linear-gradient(135deg, rgba(2, 0, 3, 0.92), rgba(95, 17, 148, 0.88))": "linear-gradient(135deg, rgba(33, 14, 46, 0.88), rgba(76, 35, 97, 0.82))",
    "linear-gradient(135deg, #1545ed, #5f1194)": "linear-gradient(135deg, #5a247b, #3b1155)",
    "radial-gradient(circle, #b601bb 0%, #1545ed 45%, #5f1194 100%)": "radial-gradient(circle, #ffd6ff 0%, #d946ef 45%, #7e22ce 100%)",
    
    # RGBA colors
    "rgba(95, 17, 148, 0.65)": "rgba(78, 11, 104, 0.75)",
    "rgba(21, 69, 237, 0.65)": "rgba(105, 28, 126, 0.82)",
    "rgba(95, 17, 148, 0.45)": "rgba(138, 69, 160, 0.55)",
    "rgba(2, 0, 3, 0.82)": "rgba(55, 22, 73, 0.78)",
    "rgba(21, 69, 237, 0.2)": "rgba(168, 85, 247, 0.15)",
    "rgba(21, 69, 237, 0.4)": "rgba(168, 85, 247, 0.35)",
    "rgba(182, 1, 187, 0.4)": "rgba(217, 70, 239, 0.4)",
    "rgba(182, 1, 187, 0.8)": "rgba(217, 70, 239, 0.8)",
    "rgba(21, 69, 237, 0.6)": "rgba(168, 85, 247, 0.6)",
    "rgba(182, 1, 187, 0.35)": "rgba(236, 72, 153, 0.35)",
    "rgba(2, 0, 3, 0.85)": "rgba(38, 18, 52, 0.85)",
    "rgba(95, 17, 148, 0.80)": "rgba(58, 28, 78, 0.95)",
    
    # Hex Colors
    "#020003": "#1a0f24",
    "#5f1194": "#9b56b2",
    "#b601bb": "#b166ca",
    "#1545ed": "#6d2f88",
    
    # Make sure border-color for fake/real in recent isn't messed up
    # They are standard CSS: #28a745 and #dc3545, so they're safe.
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Original colors reverted successfully.")
