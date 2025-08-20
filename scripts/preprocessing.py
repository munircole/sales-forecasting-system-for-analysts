import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder, OneHotEncoder
from sklearn.impute import SimpleImputer
import matplotlib.pyplot as plt
import seaborn as sns

class DataPreprocessor:
    """Comprehensive data preprocessing class for sales forecasting"""
    
    def __init__(self):
        self.scalers = {}
        self.encoders = {}
        self.imputers = {}
        self.feature_names = []
        
    def handle_missing_values(self, df, strategy='mean', columns=None):
        """Handle missing values in the dataset"""
        if columns is None:
            columns = df.columns
            
        processed_df = df.copy()
        
        for col in columns:
            if df[col].isnull().sum() > 0:
                if df[col].dtype in ['int64', 'float64']:
                    # Numeric columns
                    if strategy == 'mean':
                        processed_df[col].fillna(df[col].mean(), inplace=True)
                    elif strategy == 'median':
                        processed_df[col].fillna(df[col].median(), inplace=True)
                    elif strategy == 'mode':
                        processed_df[col].fillna(df[col].mode()[0], inplace=True)
                    elif strategy == 'zero':
                        processed_df[col].fillna(0, inplace=True)
                else:
                    # Categorical columns
                    processed_df[col].fillna(df[col].mode()[0], inplace=True)
                    
        return processed_df
    
    def remove_outliers(self, df, columns=None, method='iqr', threshold=1.5):
        """Remove outliers using IQR or Z-score method"""
        if columns is None:
            columns = df.select_dtypes(include=[np.number]).columns
            
        processed_df = df.copy()
        
        for col in columns:
            if method == 'iqr':
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - threshold * IQR
                upper_bound = Q3 + threshold * IQR
                
                processed_df = processed_df[
                    (processed_df[col] >= lower_bound) & 
                    (processed_df[col] <= upper_bound)
                ]
            elif method == 'zscore':
                z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
                processed_df = processed_df[z_scores < threshold]
                
        return processed_df
    
    def scale_features(self, df, columns=None, method='minmax'):
        """Scale numeric features"""
        if columns is None:
            columns = df.select_dtypes(include=[np.number]).columns
            
        processed_df = df.copy()
        
        if method == 'minmax':
            scaler = MinMaxScaler()
        elif method == 'standard':
            scaler = StandardScaler()
        else:
            raise ValueError("Method must be 'minmax' or 'standard'")
            
        processed_df[columns] = scaler.fit_transform(processed_df[columns])
        self.scalers[method] = scaler
        
        return processed_df
    
    def encode_categorical(self, df, columns=None, method='label'):
        """Encode categorical variables"""
        if columns is None:
            columns = df.select_dtypes(include=['object']).columns
            
        processed_df = df.copy()
        
        for col in columns:
            if method == 'label':
                le = LabelEncoder()
                processed_df[col] = le.fit_transform(processed_df[col].astype(str))
                self.encoders[col] = le
            elif method == 'onehot':
                # One-hot encoding
                dummies = pd.get_dummies(processed_df[col], prefix=col)
                processed_df = pd.concat([processed_df.drop(col, axis=1), dummies], axis=1)
                
        return processed_df
    
    def create_time_features(self, df, date_column):
        """Create time-based features from date column"""
        processed_df = df.copy()
        
        if date_column in df.columns:
            processed_df[date_column] = pd.to_datetime(processed_df[date_column])
            
            # Extract time features
            processed_df['year'] = processed_df[date_column].dt.year
            processed_df['month'] = processed_df[date_column].dt.month
            processed_df['day'] = processed_df[date_column].dt.day
            processed_df['day_of_week'] = processed_df[date_column].dt.dayofweek
            processed_df['day_of_year'] = processed_df[date_column].dt.dayofyear
            processed_df['week_of_year'] = processed_df[date_column].dt.isocalendar().week
            processed_df['quarter'] = processed_df[date_column].dt.quarter
            processed_df['is_weekend'] = (processed_df[date_column].dt.dayofweek >= 5).astype(int)
            processed_df['is_month_start'] = processed_df[date_column].dt.is_month_start.astype(int)
            processed_df['is_month_end'] = processed_df[date_column].dt.is_month_end.astype(int)
            
            # Cyclical encoding for periodic features
            processed_df['month_sin'] = np.sin(2 * np.pi * processed_df['month'] / 12)
            processed_df['month_cos'] = np.cos(2 * np.pi * processed_df['month'] / 12)
            processed_df['day_sin'] = np.sin(2 * np.pi * processed_df['day_of_week'] / 7)
            processed_df['day_cos'] = np.cos(2 * np.pi * processed_df['day_of_week'] / 7)
            
        return processed_df
    
    def create_lag_features(self, df, target_column, lags=[1, 7, 30]):
        """Create lag features for time series"""
        processed_df = df.copy()
        
        for lag in lags:
            processed_df[f'{target_column}_lag_{lag}'] = processed_df[target_column].shift(lag)
            
        # Rolling statistics
        for window in [7, 14, 30]:
            processed_df[f'{target_column}_rolling_mean_{window}'] = (
                processed_df[target_column].rolling(window=window).mean()
            )
            processed_df[f'{target_column}_rolling_std_{window}'] = (
                processed_df[target_column].rolling(window=window).std()
            )
            
        return processed_df
    
    def create_interaction_features(self, df, numeric_columns=None, max_interactions=5):
        """Create interaction features between numeric columns"""
        if numeric_columns is None:
            numeric_columns = df.select_dtypes(include=[np.number]).columns[:max_interactions]
            
        processed_df = df.copy()
        
        for i in range(len(numeric_columns)):
            for j in range(i + 1, len(numeric_columns)):
                col1, col2 = numeric_columns[i], numeric_columns[j]
                
                # Multiplication
                processed_df[f'{col1}_{col2}_mult'] = processed_df[col1] * processed_df[col2]
                
                # Division (avoid division by zero)
                processed_df[f'{col1}_{col2}_div'] = processed_df[col1] / (processed_df[col2] + 1e-8)
                
                # Addition
                processed_df[f'{col1}_{col2}_add'] = processed_df[col1] + processed_df[col2]
                
        return processed_df
    
    def detect_anomalies(self, df, columns=None, method='isolation_forest'):
        """Detect anomalies in the data"""
        if columns is None:
            columns = df.select_dtypes(include=[np.number]).columns
            
        from sklearn.ensemble import IsolationForest
        from sklearn.svm import OneClassSVM
        
        if method == 'isolation_forest':
            detector = IsolationForest(contamination=0.1, random_state=42)
        elif method == 'one_class_svm':
            detector = OneClassSVM(nu=0.1)
        else:
            raise ValueError("Method must be 'isolation_forest' or 'one_class_svm'")
            
        anomalies = detector.fit_predict(df[columns])
        return anomalies == -1  # True for anomalies
    
    def generate_preprocessing_report(self, original_df, processed_df):
        """Generate a comprehensive preprocessing report"""
        report = {
            'original_shape': original_df.shape,
            'processed_shape': processed_df.shape,
            'rows_removed': original_df.shape[0] - processed_df.shape[0],
            'columns_added': processed_df.shape[1] - original_df.shape[1],
            'missing_values_before': original_df.isnull().sum().sum(),
            'missing_values_after': processed_df.isnull().sum().sum(),
            'numeric_columns': len(processed_df.select_dtypes(include=[np.number]).columns),
            'categorical_columns': len(processed_df.select_dtypes(include=['object']).columns),
        }
        
        return report
    
    def full_preprocessing_pipeline(self, df, target_column, date_column=None, 
                                  missing_strategy='mean', scaling_method='minmax',
                                  encoding_method='label', remove_outliers=True,
                                  create_time_features=True, create_lag_features=True,
                                  create_interactions=True):
        """Complete preprocessing pipeline"""
        
        print("Starting preprocessing pipeline...")
        original_df = df.copy()
        processed_df = df.copy()
        
        # 1. Handle missing values
        print("1. Handling missing values...")
        processed_df = self.handle_missing_values(processed_df, strategy=missing_strategy)
        
        # 2. Remove outliers
        if remove_outliers:
            print("2. Removing outliers...")
            processed_df = self.remove_outliers(processed_df)
        
        # 3. Create time features
        if create_time_features and date_column:
            print("3. Creating time features...")
            processed_df = self.create_time_features(processed_df, date_column)
        
        # 4. Create lag features
        if create_lag_features and target_column:
            print("4. Creating lag features...")
            processed_df = self.create_lag_features(processed_df, target_column)
        
        # 5. Encode categorical variables
        print("5. Encoding categorical variables...")
        processed_df = self.encode_categorical(processed_df, method=encoding_method)
        
        # 6. Create interaction features
        if create_interactions:
            print("6. Creating interaction features...")
            numeric_cols = processed_df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 1:
                processed_df = self.create_interaction_features(processed_df, numeric_cols[:3])
        
        # 7. Scale features
        print("7. Scaling features...")
        numeric_columns = processed_df.select_dtypes(include=[np.number]).columns
        if target_column in numeric_columns:
            numeric_columns = numeric_columns.drop(target_column)
        processed_df = self.scale_features(processed_df, numeric_columns, method=scaling_method)
        
        # 8. Generate report
        report = self.generate_preprocessing_report(original_df, processed_df)
        
        print("Preprocessing completed!")
        print(f"Original shape: {report['original_shape']}")
        print(f"Processed shape: {report['processed_shape']}")
        print(f"Rows removed: {report['rows_removed']}")
        print(f"Columns added: {report['columns_added']}")
        
        return processed_df, report

# Example usage
if __name__ == "__main__":
    # Create sample data
    np.random.seed(42)
    n_samples = 1000
    
    dates = pd.date_range('2020-01-01', periods=n_samples, freq='D')
    
    sample_data = {
        'date': dates,
        'sales': np.random.normal(1000, 200, n_samples),
        'marketing_spend': np.random.normal(500, 100, n_samples),
        'temperature': np.random.normal(20, 10, n_samples),
        'season': np.random.choice(['Spring', 'Summer', 'Fall', 'Winter'], n_samples),
        'product_category': np.random.choice(['A', 'B', 'C'], n_samples),
    }
    
    df = pd.DataFrame(sample_data)
    
    # Add some missing values
    df.loc[np.random.choice(df.index, 50), 'marketing_spend'] = np.nan
    df.loc[np.random.choice(df.index, 30), 'temperature'] = np.nan
    
    # Add some correlation
    df['sales'] = df['sales'] + 0.5 * df['marketing_spend'].fillna(df['marketing_spend'].mean())
    
    # Initialize preprocessor
    preprocessor = DataPreprocessor()
    
    # Run full preprocessing pipeline
    processed_df, report = preprocessor.full_preprocessing_pipeline(
        df, 
        target_column='sales',
        date_column='date'
    )
    
    print("\nPreprocessing Report:")
    for key, value in report.items():
        print(f"{key}: {value}")
