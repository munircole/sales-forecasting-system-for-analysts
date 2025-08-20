import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
import matplotlib.pyplot as plt
import seaborn as sns
import json

def prepare_data(df, target_column):
    """Prepare data for decision tree model"""
    # Handle missing values
    df = df.fillna(df.mean(numeric_only=True))
    
    # Encode categorical variables
    le = LabelEncoder()
    categorical_columns = df.select_dtypes(include=['object']).columns
    
    for col in categorical_columns:
        if col != target_column:
            df[col] = le.fit_transform(df[col].astype(str))
    
    # Separate features and target
    X = df.drop(columns=[target_column])
    y = df[target_column]
    
    return X, y

def train_decision_tree(X, y, random_state=42):
    """Train decision tree model"""
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_state
    )
    
    # Train model
    model = DecisionTreeRegressor(
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=random_state
    )
    
    model.fit(X_train, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    mse = mean_squared_error(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    return {
        'model': model,
        'metrics': {
            'mse': mse,
            'mae': mae,
            'r2': r2,
            'accuracy': max(0, r2)  # Use R² as accuracy measure
        },
        'predictions': y_pred,
        'actual': y_test,
        'feature_importance': dict(zip(X.columns, model.feature_importances_))
    }

def evaluate_model(results):
    """Evaluate model performance"""
    print("Decision Tree Model Evaluation")
    print("=" * 40)
    print(f"Mean Squared Error: {results['metrics']['mse']:.4f}")
    print(f"Mean Absolute Error: {results['metrics']['mae']:.4f}")
    print(f"R² Score: {results['metrics']['r2']:.4f}")
    print(f"Accuracy: {results['metrics']['accuracy']:.4f}")
    
    # Feature importance
    print("\nTop 5 Most Important Features:")
    importance_sorted = sorted(
        results['feature_importance'].items(), 
        key=lambda x: x[1], 
        reverse=True
    )
    
    for feature, importance in importance_sorted[:5]:
        print(f"{feature}: {importance:.4f}")
    
    return results

# Example usage
if __name__ == "__main__":
    # Sample data creation for testing
    np.random.seed(42)
    n_samples = 1000
    
    sample_data = {
        'date': pd.date_range('2020-01-01', periods=n_samples, freq='D'),
        'sales': np.random.normal(1000, 200, n_samples),
        'marketing_spend': np.random.normal(500, 100, n_samples),
        'season': np.random.choice(['Spring', 'Summer', 'Fall', 'Winter'], n_samples),
        'day_of_week': np.random.choice(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], n_samples),
        'temperature': np.random.normal(20, 10, n_samples)
    }
    
    df = pd.DataFrame(sample_data)
    
    # Add some correlation to make it realistic
    df['sales'] = df['sales'] + 0.5 * df['marketing_spend'] + np.random.normal(0, 50, n_samples)
    
    print("Training Decision Tree Model...")
    X, y = prepare_data(df, 'sales')
    results = train_decision_tree(X, y)
    evaluate_model(results)
