import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, MaxPooling1D, Flatten, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def prepare_cnn_data(df, target_column, seq_length=30):
    """Prepare data for 1D CNN model"""
    # Sort by date if available
    date_columns = ['date', 'Date', 'DATE', 'timestamp']
    date_col = None
    for col in date_columns:
        if col in df.columns:
            date_col = col
            break
    
    if date_col:
        df = df.sort_values(date_col)
    
    # Extract target variable
    target_data = df[target_column].values.reshape(-1, 1)
    
    # Scale the data
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(target_data)
    
    # Create sequences for CNN
    X, y = [], []
    for i in range(len(scaled_data) - seq_length):
        X.append(scaled_data[i:(i + seq_length)])
        y.append(scaled_data[i + seq_length])
    
    X = np.array(X)
    y = np.array(y)
    
    # Split data
    train_size = int(len(X) * 0.8)
    X_train, X_test = X[:train_size], X[train_size:]
    y_train, y_test = y[:train_size], y[train_size:]
    
    return X_train, X_test, y_train, y_test, scaler

def build_cnn_model(input_shape):
    """Build 1D CNN model architecture"""
    model = Sequential([
        Conv1D(filters=64, kernel_size=3, activation='relu', input_shape=input_shape),
        Conv1D(filters=64, kernel_size=3, activation='relu'),
        MaxPooling1D(pool_size=2),
        Dropout(0.2),
        
        Conv1D(filters=50, kernel_size=3, activation='relu'),
        Conv1D(filters=50, kernel_size=3, activation='relu'),
        MaxPooling1D(pool_size=2),
        Dropout(0.2),
        
        Flatten(),
        Dense(50, activation='relu'),
        Dropout(0.2),
        Dense(1, activation='linear')
    ])
    
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='mean_squared_error',
        metrics=['mae']
    )
    
    return model

def train_cnn_model(X_train, X_test, y_train, y_test, epochs=50):
    """Train 1D CNN model"""
    model = build_cnn_model((X_train.shape[1], X_train.shape[2]))
    
    # Train the model
    history = model.fit(
        X_train, y_train,
        batch_size=32,
        epochs=epochs,
        validation_data=(X_test, y_test),
        verbose=1
    )
    
    # Make predictions
    y_pred = model.predict(X_test, verbose=0)
    
    return model, y_pred, history

def evaluate_cnn_model(y_test, y_pred, scaler):
    """Evaluate 1D CNN model performance"""
    # Inverse transform predictions
    y_test_orig = scaler.inverse_transform(y_test.reshape(-1, 1))
    y_pred_orig = scaler.inverse_transform(y_pred)
    
    # Calculate metrics
    mse = mean_squared_error(y_test_orig, y_pred_orig)
    mae = mean_absolute_error(y_test_orig, y_pred_orig)
    r2 = r2_score(y_test_orig, y_pred_orig)
    
    results = {
        'metrics': {
            'mse': mse,
            'mae': mae,
            'r2': r2,
            'accuracy': max(0, r2)
        },
        'predictions': y_pred_orig.flatten(),
        'actual': y_test_orig.flatten()
    }
    
    print("1D CNN Model Evaluation")
    print("=" * 25)
    print(f"Mean Squared Error: {mse:.4f}")
    print(f"Mean Absolute Error: {mae:.4f}")
    print(f"R² Score: {r2:.4f}")
    print(f"Accuracy: {results['metrics']['accuracy']:.4f}")
    
    return results

# Example usage
if __name__ == "__main__":
    # Sample time series data with patterns
    np.random.seed(42)
    dates = pd.date_range('2020-01-01', periods=1000, freq='D')
    
    # Create complex sales pattern
    t = np.arange(1000)
    trend = 1000 + 0.5 * t
    seasonal = 200 * np.sin(2 * np.pi * t / 365.25) + 100 * np.sin(2 * np.pi * t / 7)
    noise = np.random.normal(0, 50, 1000)
    sales = trend + seasonal + noise
    
    df = pd.DataFrame({
        'date': dates,
        'sales': sales
    })
    
    print("Training 1D CNN model...")
    X_train, X_test, y_train, y_test, scaler = prepare_cnn_data(df, 'sales')
    model, y_pred, history = train_cnn_model(X_train, X_test, y_train, y_test, epochs=30)
    results = evaluate_cnn_model(y_test, y_pred, scaler)
