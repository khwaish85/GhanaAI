from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS
import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, BatchNormalization, Dropout, Multiply
from tensorflow.keras.applications import MobileNetV2, EfficientNetB4, EfficientNetV2B3
from tensorflow.keras.preprocessing import image
# You explicitly enabled mixed precision in your training code.
# Ensure this is set before loading models if your models were trained with it.
tf.keras.mixed_precision.set_global_policy(tf.keras.mixed_precision.Policy('mixed_float16'))


app = Flask(__name__)
CORS(app)  # Enable CORS for your React Native app

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'model')

# ----------------- MODEL BUILDING FUNCTIONS -----------------
# These functions MUST EXACTLY match the architecture that produced the .h5 weights files.

def build_tomato_model():
    """
    Builds the MobileNetV2 model architecture for tomato disease classification.
    This architecture is based on the iterative error analysis provided.
    It's the most informed guess without the original training script's model.summary().
    """
    base_model = MobileNetV2(include_top=False, input_shape=(224, 224, 3), weights=None)
    x = base_model.output
    x = GlobalAveragePooling2D()(x) # Output is typically (None, 1280) for MobileNetV2 alpha=1.0

    # Based on the error: `previous_dense_layer` expecting (1280, 384) but received (1280, 768)
    # This means the *saved* layer named `previous_dense_layer` has 768 units and takes 1280 inputs.
    x = Dense(768, activation='relu', name='previous_dense_layer')(x) 
    
    # Based on the error: `output_layer` expecting (384, 10) but received (384, 5).
    # This implies there was a layer that produced 384 features *before* the output layer.
    # It seems it was named `dense` by default in your original model.
    x = Dense(384, activation='relu', name='dense')(x) # Keras often defaults to 'dense' for the first unnamed Dense layer
    
    x = Dropout(0.3)(x) # Keeping Dropout as it's common and appeared in your previous def.

    # The final output layer: Takes 384 inputs and outputs 5 classes, named `output_layer`
    predictions = Dense(5, activation='softmax', name='output_layer')(x) 
    
    model = Model(inputs=base_model.input, outputs=predictions)
    
    try:
        model.load_weights(os.path.join(MODELS_DIR, 'tomato_mobilenet_best.weights.h5'))
        print("    --> Tomato model weights loaded successfully.")
    except Exception as e:
        print(f"    --> FAILED to load tomato model weights: {e}")
        print("    HINT: The architecture for build_tomato_model() still does not EXACTLY match the saved weights. Check every layer's name, type, and number of units.")
        raise # Re-raise to be caught by the main loading block
    return model


def build_maize_model():
    """
    Builds the EfficientNetB4 model architecture for maize disease classification.
    This is built EXACTLY as per the training code you provided, with regularizers.
    """
    base_model = EfficientNetB4(
        input_shape=(256, 256, 3), # Input size from your training code
        include_top=False,
        weights='imagenet') # Use 'imagenet' weights as in your training script

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = BatchNormalization()(x) # As per your training code

    # Channel Attention (from your training code)
    # EfficientNetB4 GlobalAveragePooling2D output is 1792 features.
    attention = Dense(512, activation='relu', name='attention_dense_1', kernel_regularizer=tf.keras.regularizers.l2(1e-4))(x) 
    attention = Dropout(0.3)(attention)
    attention = Dense(x.shape[-1], activation='sigmoid', name='attention_dense_2', kernel_regularizer=tf.keras.regularizers.l2(1e-4))(attention)
    x = Multiply()([x, attention])

    # Enhanced Classifier Head (from your training code)
    x = Dense(1024, activation='relu', name='classifier_dense_1', kernel_regularizer=tf.keras.regularizers.l2(1e-4))(x)
    x = Dropout(0.5)(x)
    x = BatchNormalization()(x)
    x = Dense(512, activation='relu', name='classifier_dense_2', kernel_regularizer=tf.keras.regularizers.l2(1e-4))(x)
    x = Dropout(0.3)(x)
    
    # 7 classes for Maize, as per your classification report
    output = Dense(7, activation='softmax', name='maize_output_layer', dtype='float32')(x) 

    model = Model(inputs=base_model.input, outputs=output)
    
    try:
        model.load_weights(os.path.join(MODELS_DIR, 'maize_best_final.weights.h5'))
        print("    --> Maize model weights loaded successfully.")
    except Exception as e:
        print(f"    --> FAILED to load maize model weights: {e}")
        print("    HINT: Ensure build_maize_model() EXACTLY matches your training script (layers, units, names, regularizers).")
        raise
    return model

# Placeholder models - their architectures MUST match your saved .h5 files
# If you run into issues with these, you'll need their original training code.

def build_cashew_model():
    # Example architecture for Cashew - adjust as needed
    base_model = MobileNetV2(include_top=False, input_shape=(224, 224, 3), weights=None)
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(256, activation='relu', name='cashew_hidden_dense')(x)
    x = Dropout(0.2)(x)
    predictions = Dense(3, activation='softmax', name='cashew_output_layer')(x) # Example: 3 classes
    model = Model(inputs=base_model.input, outputs=predictions)
    try:
        model.load_weights(os.path.join(MODELS_DIR, 'cashew_model.h5'))
        print("    --> Cashew model weights loaded successfully.")
    except Exception as e:
        print(f"    --> FAILED to load cashew model weights: {e}")
        raise
    return model

def build_cassava_model():
    # Example architecture for Cassava - adjust as needed
    # Using EfficientNetV2B3 as a common robust choice if specific type not known
    base_model = EfficientNetV2B3(include_top=False, input_shape=(224, 224, 3), weights=None)
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu', name='cassava_hidden_dense')(x)
    predictions = Dense(4, activation='softmax', name='cassava_output_layer')(x) # Example: 4 classes
    model = Model(inputs=base_model.input, outputs=predictions)
    try:
        model.load_weights(os.path.join(MODELS_DIR, 'cassava_model.h5'))
        print("    --> Cassava model weights loaded successfully.")
    except Exception as e:
        print(f"    --> FAILED to load cassava model weights: {e}")
        raise
    return model

# ----------------- LOAD ALL MODELS -----------------
models = {} # Dictionary to hold loaded models and their labels
loading_failed_flag = False # Flag to indicate if any critical model loading failed

print(f"\n[{__name__}] Attempting to load all models from: {MODELS_DIR}")

# Attempt to load Tomato model
try:
    print("Loading Tomato model...")
    models["tomato"] = {
        "model": build_tomato_model(),
        "labels": [
            # IMPORTANT: Confirm these 5 labels match your ACTUAL tomato classes in your dataset.
            'Tomato_Bacterial_spot', 'Tomato_Early_blight', 'Tomato_Healthy', 
            'Tomato_Late_blight', 'Tomato_Leaf_Mold' 
        ]
    }
except Exception as e:
    loading_failed_flag = True
    print(f"CRITICAL: Tomato model loading failed. Server will NOT provide Tomato predictions. Error: {e}")

# Attempt to load Maize model
try:
    print("Loading Maize model...")
    models["maize"] = {
        "model": build_maize_model(),
        "labels": [
            'fall armyworm', 'grasshopper', 'healthy', 'leaf beetle',
            'leaf blight', 'leaf spot', 'streak virus'
        ] # These 7 labels from your classification report.
    }
except Exception as e:
    loading_failed_flag = True
    print(f"CRITICAL: Maize model loading failed. Server will NOT provide Maize predictions. Error: {e}")

# Attempt to load Cashew model (Placeholder - adjust if you have actual models/labels)
try:
    print("Loading Cashew model...")
    models["cashew"] = {
        "model": build_cashew_model(),
        "labels": ['Cashew_Healthy', 'Cashew_Anthracnose', 'Cashew_TeaMosquitoBug'] # Placeholder labels
    }
except Exception as e:
    # Use print for non-critical models, or if you don't expect them to be available yet
    print(f"WARNING: Cashew model loading failed (placeholder). Predictions for Cashew might not work. Error: {e}")

# Attempt to load Cassava model (Placeholder - adjust if you have actual models/labels)
try:
    print("Loading Cassava model...")
    models["cassava"] = {
        "model": build_cassava_model(),
        "labels": ['Cassava_Healthy', 'Cassava_Bacterial_Blight', 'Cassava_Brown_Streak_Disease', 'Cassava_Green_Mottle'] # Placeholder labels
    }
except Exception as e:
    print(f"WARNING: Cassava model loading failed (placeholder). Predictions for Cassava might not work. Error: {e}")


if not models: # Check if the models dictionary is completely empty after trying to load
    print("\nFATAL: No models were loaded successfully. The Flask server cannot start without any working models. Please resolve the model loading errors (see above tracebacks).")
else:
    print("\n--- Model Loading Summary ---")
    print(f"Successfully loaded models: {list(models.keys())}")
    if loading_failed_flag:
        print("WARNING: One or more critical models (Tomato/Maize) failed to load. Review above error messages for details.")
    print("---------------------------\n")


# ----------------- IMAGE PREPROCESSING -----------------

def preprocess_image(img, target_size=(224, 224)):
    """
    Preprocesses the image for model inference.
    - Converts to RGB if not already.
    - Resizes to target_size.
    - Converts to numpy array and normalizes pixel values.
    - Adds a batch dimension.
    """
    if img.mode != 'RGB':
        img = img.convert('RGB')
    # Use Image.LANCZOS for high-quality downsampling if Pillow version supports it
    img = img.resize(target_size, Image.LANCZOS if hasattr(Image, 'LANCZOS') else Image.ANTIALIAS)
    img_array = image.img_to_array(img) / 255.0  # Normalize to [0, 1]
    img_array = np.expand_dims(img_array, axis=0) # Add batch dimension
    return img_array

# ----------------- PREDICTION ENDPOINT -----------------

@app.route('/predict/<crop_type>', methods=['POST'])
def predict_crop(crop_type):
    # Check if the model for the requested crop_type was successfully loaded
    if crop_type not in models or "model" not in models[crop_type]:
        return jsonify({
            'error': f'Prediction model for "{crop_type}" is not available or failed to load on server startup.',
            'available_models': list(models.keys())
        }), 404

    if 'file' not in request.files:
        return jsonify({'error': 'No image file uploaded.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file.'}), 400

    # Optional: Retrieve date from form data if sent (for logging, not prediction logic)
    # date_str = request.form.get('date')
    # if date_str:
    #     try:
    #         from datetime import datetime
    #         received_date = datetime.fromisoformat(date_str.replace('Z', '+00:00')) 
    #         app.logger.info(f"Received image for {crop_type} on {received_date.strftime('%Y-%m-%d')}")
    #     except ValueError:
    #         app.logger.warning(f"Invalid date format received: {date_str}")

    try:
        img = Image.open(file.stream)
        
        model_info = models[crop_type]
        model = model_info['model']
        labels = model_info['labels']

        # Determine target_size from the model's input shape
        input_shape_tuple = model.input_shape
        # input_shape is typically (None, height, width, channels)
        if len(input_shape_tuple) == 4 and input_shape_tuple[1] is not None and input_shape_tuple[2] is not None:
            target_size = (input_shape_tuple[1], input_shape_tuple[2])
        else:
            # Fallback to a common size if model input_shape is not explicit or malformed
            target_size = (224, 224) 
            app.logger.warning(f"Unexpected input shape for model {crop_type}: {input_shape_tuple}. Using default 224x224.")
        
        processed_img = preprocess_image(img, target_size=target_size)

        preds = model.predict(processed_img)[0]
        predicted_class_index = np.argmax(preds)
        
        # Ensure the predicted index is within the bounds of your labels list
        if predicted_class_index >= len(labels):
            predicted_label = "Unknown Class (Index out of bounds for labels list)"
            confidence = 0.0
            app.logger.error(f"Prediction index {predicted_class_index} out of bounds for labels {labels} in model {crop_type}.")
        else:
            predicted_label = labels[predicted_class_index]
            confidence = float(preds[predicted_class_index])

        return jsonify({
            'crop': crop_type,
            'prediction': predicted_label,
            'confidence': confidence
        })

    except Exception as e:
        app.logger.error(f"Prediction error for {crop_type}: {str(e)}")
        # Provide a more generic error message to the user if the specific error is too technical
        return jsonify({'error': f'Prediction failed for {crop_type}: An internal server error occurred. Please check the image or try again later. Details: {str(e)}'}), 500

# ----------------- RUN APP -----------------

if __name__ == '__main__':
    # The 'models' dictionary is populated during import/initialization
    # The server will only start if at least one model was successfully loaded.
    if not models:
        print("\nServer startup aborted. No models were loaded successfully. Please check model paths, filenames, and architecture definitions in app.py.\n")
    else:
        print("\nFlask app starting...")
        # Your React Native app is configured to port 5001. Ensure this matches.
        app.run(debug=True, host='0.0.0.0', port=5001)