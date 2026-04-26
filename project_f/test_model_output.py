import torch
from model import DeepfakeModel

model = DeepfakeModel()
x = torch.randn(1, 3, 224, 224)
output = model(x)
print(type(output))
try:
    prob = torch.softmax(output, dim=1)
except Exception as e:
    print("Error:", e)
