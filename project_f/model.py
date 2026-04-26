import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
# --- [1] الطبقات المساعدة ---
class StatsNet(nn.Module):
    def __init__(self):
        super(StatsNet, self).__init__()
    def forward(self, x):
        x = x.view(x.data.shape[0], x.data.shape[1], x.data.shape[2]*x.data.shape[3])
        return torch.stack((torch.mean(x, 2), torch.std(x, 2)), dim=1)

class View(nn.Module):
    def __init__(self, *shape):
        super(View, self).__init__()
        self.shape = shape
    def forward(self, input):
        return input.view(self.shape)

# --- [2] مستخرج الميزات (EfficientNet B3) ---
class VggExtractor(nn.Module):
    def __init__(self):
        super(VggExtractor, self).__init__()
        # تحميل الموديل الأساسي
        vgg = models.efficientnet_b3(weights='DEFAULT')
        
        # نأخذ أول 4 بلوكات حتى نصل لخريطة بــ 48 قناة (features[3])
        self.vgg_1 = nn.Sequential(
            vgg.features[0],
            vgg.features[1],
            vgg.features[2],
            vgg.features[3]
        )
        
    def forward(self, input):
        return self.vgg_1(input)

# --- [3] معمارية الكبسولات ---
class FeatureExtractor(nn.Module):
    def __init__(self):
        super(FeatureExtractor, self).__init__()
        self.capsules = nn.ModuleList([
            nn.Sequential(
                nn.Conv2d(48, 64, kernel_size=3, stride=1, padding=1),
                nn.BatchNorm2d(64),
                nn.ReLU(),
                nn.Conv2d(64, 16, kernel_size=3, stride=1, padding=1),
                nn.BatchNorm2d(16),
                nn.ReLU(),
                StatsNet(),
                nn.Conv1d(2, 8, kernel_size=5, stride=2, padding=2),
                nn.BatchNorm1d(8),
                nn.Conv1d(8, 1, kernel_size=3, stride=1, padding=1),
                nn.BatchNorm1d(1),
                View(-1, 8),
            ) for _ in range(3)])
            
    def forward(self, x):
        outputs = [capsule(x) for capsule in self.capsules]
        output = torch.stack(outputs, dim=-1)
        scale = (output**2).sum(dim=-1, keepdim=True) / (1 + (output**2).sum(dim=-1, keepdim=True))
        return scale * output / torch.sqrt((output**2).sum(dim=-1, keepdim=True))

# --- [4] طبقة التوجيه (Routing Layer) ---
class RoutingLayer(nn.Module):
    def __init__(self, gpu_id, num_input_capsules, num_output_capsules, data_in, data_out, num_iterations):
        super(RoutingLayer, self).__init__()
        self.num_iterations = num_iterations
        self.route_weights = nn.Parameter(torch.randn(num_output_capsules, num_input_capsules, data_out, data_in))
        
    def forward(self, x, random=False, dropout=0.0):
        x = x.transpose(2, 1)
        route_weights = self.route_weights
        priors = route_weights[:, None, :, :, :] @ x[None, :, :, :, None]
        priors = priors.transpose(1, 0)
        logits = torch.zeros(*priors.size()).to(x.device)
        for i in range(self.num_iterations):
            probs = F.softmax(logits, dim=2)
            outputs = (probs * priors).sum(dim=2, keepdim=True)
            if i != self.num_iterations - 1:
                logits = logits + (priors * outputs)
        # Keep batch dimension for batch_size=1 by squeezing explicit axes only.
        return outputs.squeeze(2).squeeze(-1).transpose(2, 1).contiguous()

# --- [5] الموديل النهائي (CapsuleNet) ---
class CapsuleNet(nn.Module):
    def __init__(self, num_class=2, gpu_id=-1):
        super(CapsuleNet, self).__init__()
        self.fea_ext = FeatureExtractor()
        self.routing_stats = RoutingLayer(gpu_id, 3, num_class, 8, 4, 2)

    def forward(self, x, random=False, dropout=0.0):
        z = self.fea_ext(x)
        z = self.routing_stats(z, random, dropout)
        classes = F.softmax(z, dim=-1)
        return z, classes.detach().mean(dim=1)


# Wrapper for backward compatibility with current imports.
class DeepfakeModel(nn.Module):
    def __init__(self, num_class=2, gpu_id=-1):
        super(DeepfakeModel, self).__init__()
        self.vgg_ext = VggExtractor()
        self.capnet = CapsuleNet(num_class=num_class, gpu_id=gpu_id)

    def forward(self, x, random=False, dropout=0.0):
        features = self.vgg_ext(x)
        return self.capnet(features, random=random, dropout=dropout)