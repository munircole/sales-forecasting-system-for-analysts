import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler, MinMaxScaler
from sklearn.impute import SimpleImputer
import json
from datetime import datetime
import re

class AutoDataAnalyzer:
    """
    Automatically analyze datasets and detect data types, handle categorical variables,
    and prepare data for segmented forecasting
    """
    
    def __init__(self):
        self.column_info = {}
        self.encoders = {}
        self.scalers = {}
        self.imputers = {}
        self.transformation_log = []
        
    def analyze_dataset(self, df):
        """
        Automatically analyze the entire dataset and detect column types
        """
        analysis_results = {
            'dataset_summary': {
                'total_rows': len(df),
                'total_columns': len(df.columns),
                'memory_usage': df.memory_usage(deep=True).sum(),
                'analysis_timestamp': datetime.now().isoformat()
            },
            'column_analysis': {},
            'data_quality': {},
            'recommendations': []
        }
        
        for column in df.columns:
            column_analysis = self._analyze_column(df[column], column)
            analysis_results['column_analysis'][column] = column_analysis
            
        # Analyze data quality
        analysis_results['data_quality'] = self._analyze_data_quality(df)
        
        # Generate recommendations
        analysis_results['recommendations'] = self._generate_recommendations(df, analysis_results)
        
        return analysis_results
    
    def _analyze_column(self, series, column_name):
        """
        Analyze individual column to determine data type and characteristics
        """
        analysis = {
            'column_name': column_name,
            'detected_type': None,
            'original_dtype': str(series.dtype),
            'null_count': series.isnull().sum(),
            'null_percentage': (series.isnull().sum() / len(series)) * 100,
            'unique_count': series.nunique(),
            'unique_percentage': (series.nunique() / len(series)) * 100,
            'sample_values': series.dropna().head(5).tolist(),
            'encoding_recommendation': None,
            'preprocessing_needed': []
        }
        
        # Remove null values for analysis
        non_null_series = series.dropna()
        
        if len(non_null_series) == 0:
            analysis['detected_type'] = 'empty'
            return analysis
        
        # Check for datetime
        if self._is_datetime_column(non_null_series):
            analysis['detected_type'] = 'datetime'
            analysis['date_range'] = {
                'min_date': pd.to_datetime(non_null_series).min().isoformat(),
                'max_date': pd.to_datetime(non_null_series).max().isoformat()
            }
            analysis['preprocessing_needed'].append('datetime_features_extraction')
            
        # Check for numeric
        elif self._is_numeric_column(non_null_series):
            analysis['detected_type'] = 'numeric'
            analysis['numeric_stats'] = {
                'min': float(pd.to_numeric(non_null_series, errors='coerce').min()),
                'max': float(pd.to_numeric(non_null_series, errors='coerce').max()),
                'mean': float(pd.to_numeric(non_null_series, errors='coerce').mean()),
                'std': float(pd.to_numeric(non_null_series, errors='coerce').std())
            }
            if analysis['null_count'] > 0:
                analysis['preprocessing_needed'].append('missing_value_imputation')
            analysis['preprocessing_needed'].append('scaling_normalization')
            
        # Check for categorical
        elif self._is_categorical_column(non_null_series):
            analysis['detected_type'] = 'categorical'
            analysis['categorical_stats'] = {
                'categories': non_null_series.value_counts().head(10).to_dict(),
                'most_frequent': non_null_series.mode().iloc[0] if len(non_null_series.mode()) > 0 else None
            }
            
            # Determine encoding strategy
            if analysis['unique_count'] <= 10:
                analysis['encoding_recommendation'] = 'one_hot_encoding'
            elif analysis['unique_count'] <= 50:
                analysis['encoding_recommendation'] = 'label_encoding'
            else:
                analysis['encoding_recommendation'] = 'target_encoding'
                
            analysis['preprocessing_needed'].append('categorical_encoding')
            if analysis['null_count'] > 0:
                analysis['preprocessing_needed'].append('missing_value_imputation')
                
        # Check for text
        else:
            analysis['detected_type'] = 'text'
            analysis['text_stats'] = {
                'avg_length': non_null_series.astype(str).str.len().mean(),
                'max_length': non_null_series.astype(str).str.len().max(),
                'contains_numbers': non_null_series.astype(str).str.contains(r'\d').any()
            }
            analysis['preprocessing_needed'].append('text_processing')
            
        return analysis
    
    def _is_datetime_column(self, series):
        """Check if column contains datetime values"""
        try:
            # Try to convert a sample to datetime
            sample = series.head(min(100, len(series)))
            pd.to_datetime(sample, errors='raise')
            return True
        except:
            # Check for common date patterns
            sample_str = series.astype(str).head(min(100, len(series)))
            date_patterns = [
                r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
                r'\d{2}/\d{2}/\d{4}',  # MM/DD/YYYY
                r'\d{2}-\d{2}-\d{4}',  # MM-DD-YYYY
                r'\d{4}/\d{2}/\d{2}',  # YYYY/MM/DD
            ]
            
            for pattern in date_patterns:
                if sample_str.str.match(pattern).any():
                    return True
            return False
    
    def _is_numeric_column(self, series):
        """Check if column contains numeric values"""
        try:
            pd.to_numeric(series, errors='raise')
            return True
        except:
            # Check if majority are numeric
            numeric_count = pd.to_numeric(series, errors='coerce').notna().sum()
            return (numeric_count / len(series)) > 0.8
    
    def _is_categorical_column(self, series):
        """Check if column should be treated as categorical"""
        # If unique values are less than 50% of total, likely categorical
        unique_ratio = series.nunique() / len(series)
        return unique_ratio < 0.5 or series.dtype == 'object'
    
    def _analyze_data_quality(self, df):
        """Analyze overall data quality"""
        return {
            'missing_data_percentage': (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100,
            'duplicate_rows': df.duplicated().sum(),
            'columns_with_missing_data': df.columns[df.isnull().any()].tolist(),
            'completely_empty_columns': df.columns[df.isnull().all()].tolist(),
            'single_value_columns': [col for col in df.columns if df[col].nunique() <= 1]
        }
    
    def _generate_recommendations(self, df, analysis):
        """Generate preprocessing recommendations"""
        recommendations = []
        
        # Missing data recommendations
        missing_pct = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
        if missing_pct > 10:
            recommendations.append({
                'type': 'data_quality',
                'priority': 'high',
                'message': f'High missing data rate ({missing_pct:.1f}%). Consider data imputation strategies.'
            })
        
        # Categorical encoding recommendations
        categorical_cols = [col for col, info in analysis['column_analysis'].items() 
                          if info['detected_type'] == 'categorical']
        if categorical_cols:
            recommendations.append({
                'type': 'preprocessing',
                'priority': 'medium',
                'message': f'Found {len(categorical_cols)} categorical columns that need encoding for ML models.'
            })
        
        # Scaling recommendations
        numeric_cols = [col for col, info in analysis['column_analysis'].items() 
                       if info['detected_type'] == 'numeric']
        if len(numeric_cols) > 1:
            recommendations.append({
                'type': 'preprocessing',
                'priority': 'medium',
                'message': 'Multiple numeric columns detected. Consider feature scaling for better model performance.'
            })
        
        return recommendations
    
    def prepare_for_modeling(self, df, target_column=None, segmentation_column=None):
        """
        Prepare dataset for modeling with automatic preprocessing
        """
        processed_df = df.copy()
        preprocessing_steps = []
        
        # Step 1: Handle missing values
        processed_df, missing_steps = self._handle_missing_values(processed_df)
        preprocessing_steps.extend(missing_steps)
        
        # Step 2: Process datetime columns
        processed_df, datetime_steps = self._process_datetime_columns(processed_df)
        preprocessing_steps.extend(datetime_steps)
        
        # Step 3: Encode categorical variables
        processed_df, encoding_steps = self._encode_categorical_variables(processed_df, target_column)
        preprocessing_steps.extend(encoding_steps)
        
        # Step 4: Scale numeric features
        processed_df, scaling_steps = self._scale_numeric_features(processed_df, target_column)
        preprocessing_steps.extend(scaling_steps)
        
        # Step 5: Prepare segmentation info
        segmentation_info = None
        if segmentation_column and segmentation_column in processed_df.columns:
            segmentation_info = self._prepare_segmentation(processed_df, segmentation_column)
        
        return {
            'processed_data': processed_df,
            'preprocessing_steps': preprocessing_steps,
            'segmentation_info': segmentation_info,
            'feature_columns': [col for col in processed_df.columns if col != target_column],
            'target_column': target_column,
            'encoders_used': self.encoders,
            'scalers_used': self.scalers
        }
    
    def _handle_missing_values(self, df):
        """Handle missing values based on column type"""
        steps = []
        processed_df = df.copy()
        
        for column in df.columns:
            if df[column].isnull().any():
                column_info = self._analyze_column(df[column], column)
                
                if column_info['detected_type'] == 'numeric':
                    # Use median for numeric columns
                    imputer = SimpleImputer(strategy='median')
                    processed_df[column] = imputer.fit_transform(processed_df[[column]]).flatten()
                    self.imputers[column] = imputer
                    steps.append(f"Filled missing values in '{column}' with median value")
                    
                elif column_info['detected_type'] == 'categorical':
                    # Use most frequent for categorical
                    imputer = SimpleImputer(strategy='most_frequent')
                    processed_df[column] = imputer.fit_transform(processed_df[[column]]).flatten()
                    self.imputers[column] = imputer
                    steps.append(f"Filled missing values in '{column}' with most frequent value")
                    
                else:
                    # Forward fill for others
                    processed_df[column] = processed_df[column].fillna(method='ffill')
                    steps.append(f"Forward filled missing values in '{column}'")
        
        return processed_df, steps
    
    def _process_datetime_columns(self, df):
        """Extract features from datetime columns"""
        steps = []
        processed_df = df.copy()
        
        for column in df.columns:
            column_info = self._analyze_column(df[column], column)
            
            if column_info['detected_type'] == 'datetime':
                # Convert to datetime
                processed_df[column] = pd.to_datetime(processed_df[column])
                
                # Extract features
                processed_df[f'{column}_year'] = processed_df[column].dt.year
                processed_df[f'{column}_month'] = processed_df[column].dt.month
                processed_df[f'{column}_day'] = processed_df[column].dt.day
                processed_df[f'{column}_dayofweek'] = processed_df[column].dt.dayofweek
                processed_df[f'{column}_quarter'] = processed_df[column].dt.quarter
                processed_df[f'{column}_is_weekend'] = (processed_df[column].dt.dayofweek >= 5).astype(int)
                
                # Cyclical encoding for month and day of week
                processed_df[f'{column}_month_sin'] = np.sin(2 * np.pi * processed_df[f'{column}_month'] / 12)
                processed_df[f'{column}_month_cos'] = np.cos(2 * np.pi * processed_df[f'{column}_month'] / 12)
                processed_df[f'{column}_dayofweek_sin'] = np.sin(2 * np.pi * processed_df[f'{column}_dayofweek'] / 7)
                processed_df[f'{column}_dayofweek_cos'] = np.cos(2 * np.pi * processed_df[f'{column}_dayofweek'] / 7)
                
                steps.append(f"Extracted datetime features from '{column}': year, month, day, day_of_week, quarter, is_weekend, cyclical encodings")
        
        return processed_df, steps
    
    def _encode_categorical_variables(self, df, target_column=None):
        """Encode categorical variables based on their characteristics"""
        steps = []
        processed_df = df.copy()
        
        for column in df.columns:
            if column == target_column:
                continue
                
            column_info = self._analyze_column(df[column], column)
            
            if column_info['detected_type'] == 'categorical':
                unique_count = column_info['unique_count']
                
                if unique_count <= 10:
                    # One-hot encoding for low cardinality
                    encoder = OneHotEncoder(sparse=False, handle_unknown='ignore')
                    encoded_data = encoder.fit_transform(processed_df[[column]])
                    
                    # Create column names
                    feature_names = [f'{column}_{cat}' for cat in encoder.categories_[0]]
                    encoded_df = pd.DataFrame(encoded_data, columns=feature_names, index=processed_df.index)
                    
                    # Drop original column and add encoded columns
                    processed_df = processed_df.drop(columns=[column])
                    processed_df = pd.concat([processed_df, encoded_df], axis=1)
                    
                    self.encoders[column] = encoder
                    steps.append(f"Applied one-hot encoding to '{column}' ({unique_count} categories)")
                    
                else:
                    # Label encoding for high cardinality
                    encoder = LabelEncoder()
                    processed_df[column] = encoder.fit_transform(processed_df[column].astype(str))
                    
                    self.encoders[column] = encoder
                    steps.append(f"Applied label encoding to '{column}' ({unique_count} categories)")
        
        return processed_df, steps
    
    def _scale_numeric_features(self, df, target_column=None):
        """Scale numeric features"""
        steps = []
        processed_df = df.copy()
        
        numeric_columns = []
        for column in df.columns:
            if column == target_column:
                continue
                
            column_info = self._analyze_column(df[column], column)
            if column_info['detected_type'] == 'numeric':
                numeric_columns.append(column)
        
        if numeric_columns:
            scaler = StandardScaler()
            processed_df[numeric_columns] = scaler.fit_transform(processed_df[numeric_columns])
            
            self.scalers['numeric_features'] = scaler
            steps.append(f"Applied standard scaling to {len(numeric_columns)} numeric columns")
        
        return processed_df, steps
    
    def _prepare_segmentation(self, df, segmentation_column):
        """Prepare segmentation information"""
        segments = df[segmentation_column].unique()
        
        segmentation_info = {
            'column': segmentation_column,
            'segments': segments.tolist(),
            'segment_counts': df[segmentation_column].value_counts().to_dict(),
            'total_segments': len(segments)
        }
        
        return segmentation_info

# Example usage and testing
if __name__ == "__main__":
    # Create sample data for testing
    np.random.seed(42)
    n_samples = 1000
    
    sample_data = {
        'date': pd.date_range('2020-01-01', periods=n_samples, freq='D'),
        'sales': np.random.normal(1000, 200, n_samples),
        'region': np.random.choice(['North', 'South', 'East', 'West'], n_samples),
        'product_category': np.random.choice(['Electronics', 'Clothing', 'Food', 'Books'], n_samples),
        'customer_type': np.random.choice(['Premium', 'Standard', 'Basic'], n_samples),
        'marketing_spend': np.random.normal(500, 100, n_samples),
        'temperature': np.random.normal(20, 10, n_samples),
        'is_holiday': np.random.choice([0, 1], n_samples, p=[0.9, 0.1]),
        'store_id': np.random.choice([f'Store_{i}' for i in range(1, 21)], n_samples),
        'description': ['Product description ' + str(i) for i in range(n_samples)]
    }
    
    df = pd.DataFrame(sample_data)
    
    # Add some missing values
    df.loc[np.random.choice(df.index, 50), 'marketing_spend'] = np.nan
    df.loc[np.random.choice(df.index, 30), 'temperature'] = np.nan
    df.loc[np.random.choice(df.index, 20), 'region'] = np.nan
    
    # Initialize analyzer
    analyzer = AutoDataAnalyzer()
    
    # Analyze dataset
    print("Analyzing dataset...")
    analysis = analyzer.analyze_dataset(df)
    
    print(f"Dataset Summary:")
    print(f"- Total rows: {analysis['dataset_summary']['total_rows']}")
    print(f"- Total columns: {analysis['dataset_summary']['total_columns']}")
    print(f"- Missing data: {analysis['data_quality']['missing_data_percentage']:.2f}%")
    
    print(f"\nColumn Analysis:")
    for col, info in analysis['column_analysis'].items():
        print(f"- {col}: {info['detected_type']} ({info['encoding_recommendation'] or 'no encoding needed'})")
    
    print(f"\nRecommendations:")
    for rec in analysis['recommendations']:
        print(f"- [{rec['priority'].upper()}] {rec['message']}")
    
    # Prepare for modeling
    print(f"\nPreparing data for modeling...")
    prepared_data = analyzer.prepare_for_modeling(df, target_column='sales', segmentation_column='region')
    
    print(f"Preprocessing steps applied:")
    for step in prepared_data['preprocessing_steps']:
        print(f"- {step}")
    
    print(f"\nSegmentation info:")
    if prepared_data['segmentation_info']:
        seg_info = prepared_data['segmentation_info']
        print(f"- Segmentation column: {seg_info['column']}")
        print(f"- Number of segments: {seg_info['total_segments']}")
        print(f"- Segments: {seg_info['segments']}")
    
    print(f"\nFinal dataset shape: {prepared_data['processed_data'].shape}")
    print(f"Feature columns: {len(prepared_data['feature_columns'])}")
