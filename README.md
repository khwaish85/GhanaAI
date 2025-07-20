# 🌾 GhanaAI – Crop Disease Detection & Market Monitoring App

An AI-powered platform for farmers to:

- 🚜 Detect crop diseases using images.
- 📊 Monitor real-time market prices.
- 🌱 Get soil health recommendations.

---

## 📂 Dataset & Pre-trained Models

> ⚠️ Download pre-trained AI models from Google Drive and place them into `/backend/model/`.

| Crop Model | Download Link |
|------------|---------------|
| Cashew     | [Download Cashew Model](https://drive.google.com/file/d/1ZrvOmYHIAAfwhr-ZW8AhV4OuU9rlC7Xe/view?usp=share_link) |
| Cassava    | [Download Cassava Model](https://drive.google.com/file/d/1ZrvOmYHIAAfwhr-ZW8AhV4OuU9rlC7Xe/view?usp=share_link) |
| Maize      | [Download Maize Model](https://drive.google.com/file/d/1-65t86txX_XmgBbFoUhHLbwgn5UQi9AM/view?usp=share_link) |
| Tomato     | [Download Tomato Model](https://drive.google.com/file/d/12I8ItQcUM7SWS4hC4JjSHPBZseVfCVwi/view?usp=share_link) |

### 🔔 After downloading:

1. Create a folder:


2. Place all downloaded model files (`.h5` or `.weights.h5`) inside that folder.

Example:


---

## 🚀 Backend – Flask API Setup

### 📌 Requirements

- Python 3.9+
- TensorFlow
- Flask
- Flask-CORS
- Pillow

### 📥 Installation

```bash
cd backend
pip install -r requirements.txt
```


##▶️ Run Backend API
```
cd backend
python3 app.py
Backend will start on:
http://YOUR_LOCAL_IP:5001/predict/<crop_type>
```

## Example:

- http://192.168.1.5:5001/predict/maize
- Replace <crop_type> with:

- maize
- tomato
- cashew
- cassava
## 📱 Frontend – React Native App Setup

##📌 Prerequisites
-Node.js
-React Native CLI
-Android Studio or Xcode
-Physical device or emulator
##📥 Install Dependencies
```
cd frontend
npm install
```

##▶️ Run App
-Start Metro Bundler:
```
npm start
Build App:
For Android:
```
```
npm run android
For iOS:
```
```
npx pod-install
npm run ios
```
##Ensure your mobile device can access the backend server over LAN.
