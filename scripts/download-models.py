import os
import requests

MODELS_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/"
TARGET_DIR = "public/models"

models_to_download = [
    # SSD Mobilenet V1
    "ssd_mobilenet_v1_model-weights_manifest.json",
    "ssd_mobilenet_v1_model-shard1",
    "ssd_mobilenet_v1_model-shard2",
    # Face Landmark 68
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    # Face Recognition
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
]

if not os.path.exists(TARGET_DIR):
    os.makedirs(TARGET_DIR)

for model in models_to_download:
    url = MODELS_URL + model
    target_path = os.path.join(TARGET_DIR, model)
    print(f"Downloading {model}...")
    try:
        response = requests.get(url)
        if response.status_code == 200:
            with open(target_path, "wb") as f:
                f.write(response.content)
            print(f"Successfully downloaded {model}")
        else:
            print(f"Failed to download {model}: HTTP {response.status_code}")
    except Exception as e:
        print(f"Error downloading {model}: {e}")
