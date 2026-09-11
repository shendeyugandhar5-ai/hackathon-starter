import os
import json
import random
import torch
import torch.nn as nn
import torch.optim as optim

class DKT(nn.Module):
    def __init__(self, num_skills=10, embed_dim=32, hidden=64):
        super().__init__()
        self.embed = nn.Embedding(num_skills * 2, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden, batch_first=True)
        self.dropout = nn.Dropout(0.2)
        self.out = nn.Linear(hidden, num_skills)

    def forward(self, x):
        e = self.embed(x)
        h, _ = self.lstm(e)
        return torch.sigmoid(self.out(self.dropout(h)))

def train_and_save():
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(curr_dir, "dkt_model.pt")
    
    # 1. Synthesize minimal fast training data
    num_skills = 10
    model = DKT(num_skills=num_skills, embed_dim=32, hidden=64)
    optimizer = optim.Adam(model.parameters(), lr=0.01)
    criterion = nn.BCELoss()
    
    # Fast training loop
    for _ in range(50):
        # Batch of simulated sequences
        seq_len = 15
        x = torch.randint(0, num_skills * 2, (16, seq_len))
        targets = torch.rand(16, seq_len, num_skills)
        
        optimizer.zero_grad()
        preds = model(x)
        loss = criterion(preds, targets)
        loss.backward()
        optimizer.step()
        
    torch.save(model.state_dict(), model_path)
    print(f"Exported DKT model weights successfully to: {model_path}")

if __name__ == "__main__":
    train_and_save()
