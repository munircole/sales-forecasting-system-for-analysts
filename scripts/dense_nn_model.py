import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def prepare_dense_data(df, target_column):
    """Prepare data for dense neural network"""
    # Handle missing values
    df = df.fillna(df.mean(numeric_only=True))
    
    # Encode categorical variables
    le_dict = {}
    categorical_columns = df.select_dtypes(include=['object']).columns
    
    for col in categorical_columns:
        if col != target_column:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            le_dict[col] = le
    
    # Extract features and target
    X = df.drop(columns=[target_column])
    y = df[target_column]
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )
    
    return X_train, X_test, y_train, y_test, scaler, le_dict

def build_dense_model(input_dim):
    """Build dense neural network architecture"""
    model = Sequential([
        Dense(128, activation='relu', input_dim=input_dim),
        BatchNormalization(),
        Dropout(0.3),
        
        Dense(64, activation='relu'),
        BatchNormalization(),
        Dropout(0.3),
        
        Dense(32, activation='relu'),
        BatchNormalization(),
        Dropout(0.2),
        
        Dense(16, activation='relu'),
        Dropout(0.2),
        
        Dense(1, activation='linear')
    ])
    
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='mean_squared_error',
        metrics=['mae']
    )
    
    return model

def train_dense_model(X_train, X_test, y_train, y_test, epochs=100):
    """Train dense neural network"""
    model = build_dense_model(X_train.shape[1])
    
    # Early stopping callback
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True
    )
    
    # Train the model
    history = model.fit(
        X_train, y_train,
        batch_size=32,
        epochs=epochs,
        validation_data=(X_test, y_test),
        callbacks=[early_stopping],
        verbose=1
    )
    
    # Make predictions
    y_pred = model.predict(X_test, verbose=0)
    
    return model, y_pred.flatten(), history

def evaluate_dense_model(y_test, y_pred):
    """Evaluate dense neural network performance"""
    # Calculate metrics
    mse = mean_squared_error(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    results = {
        'metrics': {
            'mse': mse,
            'mae': mae,
            'r2': r2,
            'accuracy': max(0, r2)
        },
        'predictions': y_pred,
        'actual': y_test
    }
    
    print("Dense Neural Network Evaluation")
    print("=" * 35)
    print(f"Mean Squared Error: {mse:.4f}")
    print(f"Mean Absolute Error: {mae:.4f}")
    print(f"R² Score: {r2:.4f}")
    print(f"Accuracy: {results['metrics']['accuracy']:.4f}")
    
    return results

# Example usage
if __name__ == "__main__":
    # Sample data creation
    np.random.seed(42)
    n_samples = 1000
    
    sample_data = {
        'marketing_spend': np.random.normal(500, 100, n_samples),
        'temperature': np.random.normal(20, 10, n_samples),
        'day_of_week': np.random.choice([0, 1, 2, 3, 4, 5, 6], n_samples),
        'month': np.random.choice(range(1, 13), n_samples),
        'competitor_price': np.random.normal(50, 10, n_samples),
        'inventory_level': np.random.normal(1000, 200, n_samples)
    }
    
    df = pd.DataFrame(sample_data)
    
    # Create target variable with realistic relationships
    df['sales'] = (
        1000 + 
        0.8 * df['marketing_spend'] + 
        5 * df['temperature'] + 
        -2 * df['competitor_price'] + 
        0.1 * df['inventory_level'] +
        np.random.normal(0, 100, n_samples)
    )
    
    print("Training Dense Neural Network...")
    X_train, X_test, y_train, y_test, scaler, le_dict = prepare_dense_data(df, 'sales')
    model, y_pred, history = train_dense_model(X_train, X_test, y_train, y_test, epochs=50)
    results = evaluate_dense_model(y_test, y_pred)
