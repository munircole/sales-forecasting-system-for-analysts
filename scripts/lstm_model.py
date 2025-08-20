import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import matplotlib.pyplot as plt

def create_sequences(data, seq_length):
    """Create sequences for LSTM training"""
    X, y = [], []
    for i in range(len(data) - seq_length):
        X.append(data[i:(i + seq_length)])
        y.append(data[i + seq_length])
    return np.array(X), np.array(y)

def prepare_lstm_data(df, target_column, seq_length=30):
    """Prepare data for LSTM model"""
    # Sort by date if date column exists
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
    
    # Create sequences
    X, y = create_sequences(scaled_data, seq_length)
    
    # Split data
    train_size = int(len(X) * 0.8)
    X_train, X_test = X[:train_size], X[train_size:]
    y_train, y_test = y[:train_size], y[train_size:]
    
    return X_train, X_test, y_train, y_test, scaler

def build_lstm_model(input_shape):
    """Build LSTM model architecture"""
    model = Sequential([
        LSTM(50, return_sequences=True, input_shape=input_shape),
        Dropout(0.2),
        LSTM(50, return_sequences=True),
        Dropout(0.2),
        LSTM(50),
        Dropout(0.2),
        Dense(25),
        Dense(1)
    ])
    
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='mean_squared_error',
        metrics=['mae']
    )
    
    return model

def train_lstm_model(X_train, X_test, y_train, y_test, epochs=50):
    """Train LSTM model"""
    model = build_lstm_model((X_train.shape[1], X_train.shape[2]))
    
    # Train the model
    history = model.fit(
        X_train, y_train,
        batch_size=32,
        epochs=epochs,
        validation_data=(X_test, y_test),
        verbose=1
    )
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    return model, y_pred, history

def evaluate_lstm_model(y_test, y_pred, scaler):
    """Evaluate LSTM model performance"""
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
    
    print("LSTM Model Evaluation")
    print("=" * 30)
    print(f"Mean Squared Error: {mse:.4f}")
    print(f"Mean Absolute Error: {mae:.4f}")
    print(f"R² Score: {r2:.4f}")
    print(f"Accuracy: {results['metrics']['accuracy']:.4f}")
    
    return results

def predict_future(model, last_sequence, scaler, n_periods=30):
    """Generate future predictions"""
    predictions = []
    current_sequence = last_sequence.copy()
    
    for _ in range(n_periods):
        # Predict next value
        next_pred = model.predict(current_sequence.reshape(1, -1, 1), verbose=0)
        predictions.append(next_pred[0, 0])
        
        # Update sequence for next prediction
        current_sequence = np.roll(current_sequence, -1)
        current_sequence[-1] = next_pred[0, 0]
    
    # Inverse transform predictions
    predictions = np.array(predictions).reshape(-1, 1)
    predictions_orig = scaler.inverse_transform(predictions)
    
    return predictions_orig.flatten()

# Example usage
if __name__ == "__main__":
    # Sample time series data
    np.random.seed(42)
    dates = pd.date_range('2020-01-01', periods=1000, freq='D')
    
    # Create synthetic sales data with trend and seasonality
    trend = np.linspace(1000, 1500, 1000)
    seasonal = 200 * np.sin(2 * np.pi * np.arange(1000) / 365.25)
    noise = np.random.normal(0, 50, 1000)
    sales = trend + seasonal + noise
    
    df = pd.DataFrame({
        'date': dates,
        'sales': sales
    })
    
    print("Preparing LSTM data...")
    X_train, X_test, y_train, y_test, scaler = prepare_lstm_data(df, 'sales')
    
    print("Training LSTM model...")
    model, y_pred, history = train_lstm_model(X_train, X_test, y_train, y_test, epochs=20)
    
    print("Evaluating LSTM model...")
    results = evaluate_lstm_model(y_test, y_pred, scaler)
    
    # Generate future predictions
    last_sequence = X_test[-1]
    future_predictions = predict_future(model, last_sequence, scaler, n_periods=30)
    print(f"\nFuture 30-day predictions generated: {len(future_predictions)} values")
