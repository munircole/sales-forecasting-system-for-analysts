import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Dropout
from auto_data_analyzer import AutoDataAnalyzer
import json
from datetime import datetime, timedelta

class SegmentedForecaster:
    """
    Advanced forecasting system that provides both global and segmented predictions
    """
    
    def __init__(self):
        self.global_model = None
        self.segment_models = {}
        self.analyzer = AutoDataAnalyzer()
        self.model_performance = {}
        self.forecast_results = {}
        
    def fit_models(self, df, target_column, segmentation_column=None, model_type='random_forest'):
        """
        Fit both global and segmented models
        """
        print("Starting model training process...")
        
        # Prepare data using auto analyzer
        prepared_data = self.analyzer.prepare_for_modeling(
            df, target_column=target_column, segmentation_column=segmentation_column
        )
        
        processed_df = prepared_data['processed_data']
        feature_columns = prepared_data['feature_columns']
        
        # Prepare features and target
        X = processed_df[feature_columns]
        y = processed_df[target_column]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train global model
        print("Training global model...")
        self.global_model = self._create_model(model_type)
        self.global_model.fit(X_train, y_train)
        
        # Evaluate global model
        global_pred = self.global_model.predict(X_test)
        self.model_performance['global'] = self._calculate_metrics(y_test, global_pred)
        
        # Train segmented models if segmentation column is provided
        if segmentation_column and prepared_data['segmentation_info']:
            print("Training segmented models...")
            segmentation_info = prepared_data['segmentation_info']
            
            for segment in segmentation_info['segments']:
                print(f"Training model for segment: {segment}")
                
                # Filter data for this segment
                segment_mask_train = processed_df.loc[X_train.index, segmentation_column] == segment
                segment_mask_test = processed_df.loc[X_test.index, segmentation_column] == segment
                
                if segment_mask_train.sum() > 10:  # Minimum samples for training
                    X_train_seg = X_train[segment_mask_train]
                    y_train_seg = y_train[segment_mask_train]
                    X_test_seg = X_test[segment_mask_test]
                    y_test_seg = y_test[segment_mask_test]
                    
                    # Train segment model
                    segment_model = self._create_model(model_type)
                    segment_model.fit(X_train_seg, y_train_seg)
                    
                    # Evaluate segment model
                    if len(X_test_seg) > 0:
                        segment_pred = segment_model.predict(X_test_seg)
                        self.model_performance[f'segment_{segment}'] = self._calculate_metrics(y_test_seg, segment_pred)
                    
                    self.segment_models[segment] = segment_model
                else:
                    print(f"Insufficient data for segment {segment}, using global model")
        
        return {
            'preprocessing_info': prepared_data,
            'model_performance': self.model_performance,
            'segments_trained': list(self.segment_models.keys())
        }
    
    def _create_model(self, model_type):
        """Create model based on specified type"""
        if model_type == 'random_forest':
            return RandomForestRegressor(n_estimators=100, random_state=42)
        elif model_type == 'linear_regression':
            return LinearRegression()
        else:
            return RandomForestRegressor(n_estimators=100, random_state=42)
    
    def _calculate_metrics(self, y_true, y_pred):
        """Calculate performance metrics"""
        return {
            'mse': mean_squared_error(y_true, y_pred),
            'mae': mean_absolute_error(y_true, y_pred),
            'r2': r2_score(y_true, y_pred),
            'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
            'mape': np.mean(np.abs((y_true - y_pred) / y_true)) * 100
        }
    
    def forecast(self, df, target_column, segmentation_column=None, forecast_periods=30):
        """
        Generate forecasts for both global and segmented data
        """
        print("Generating forecasts...")
        
        # Prepare data
        prepared_data = self.analyzer.prepare_for_modeling(
            df, target_column=target_column, segmentation_column=segmentation_column
        )
        
        processed_df = prepared_data['processed_data']
        feature_columns = prepared_data['feature_columns']
        
        # Generate global forecast
        print("Generating global forecast...")
        global_forecast = self._generate_global_forecast(
            processed_df, feature_columns, forecast_periods
        )
        
        # Generate segmented forecasts
        segmented_forecasts = {}
        if segmentation_column and prepared_data['segmentation_info']:
            print("Generating segmented forecasts...")
            segmentation_info = prepared_data['segmentation_info']
            
            for segment in segmentation_info['segments']:
                if segment in self.segment_models:
                    segment_data = processed_df[processed_df[segmentation_column] == segment]
                    if len(segment_data) > 0:
                        segmented_forecasts[segment] = self._generate_segment_forecast(
                            segment_data, feature_columns, segment, forecast_periods
                        )
        
        # Compile results
        forecast_results = {
            'global_forecast': global_forecast,
            'segmented_forecasts': segmented_forecasts,
            'forecast_metadata': {
                'target_column': target_column,
                'segmentation_column': segmentation_column,
                'forecast_periods': forecast_periods,
                'forecast_generated_at': datetime.now().isoformat(),
                'total_segments': len(segmented_forecasts)
            }
        }
        
        self.forecast_results = forecast_results
        return forecast_results
    
    def _generate_global_forecast(self, df, feature_columns, periods):
        """Generate global forecast"""
        # Use last known values as base for forecasting
        last_row = df[feature_columns].iloc[-1:].copy()
        
        forecasts = []
        for i in range(periods):
            # Predict next value
            pred = self.global_model.predict(last_row)[0]
            
            # Create forecast entry
            forecast_date = datetime.now() + timedelta(days=i+1)
            forecasts.append({
                'date': forecast_date.isoformat(),
                'predicted_value': float(pred),
                'period': i + 1
            })
            
            # Update features for next prediction (simple approach)
            # In practice, you'd want more sophisticated feature updating
            
        return {
            'forecasts': forecasts,
            'summary': {
                'total_forecast': sum([f['predicted_value'] for f in forecasts]),
                'average_forecast': np.mean([f['predicted_value'] for f in forecasts]),
                'trend': 'increasing' if forecasts[-1]['predicted_value'] > forecasts[0]['predicted_value'] else 'decreasing'
            }
        }
    
    def _generate_segment_forecast(self, segment_data, feature_columns, segment_name, periods):
        """Generate forecast for specific segment"""
        model = self.segment_models[segment_name]
        last_row = segment_data[feature_columns].iloc[-1:].copy()
        
        forecasts = []
        for i in range(periods):
            pred = model.predict(last_row)[0]
            
            forecast_date = datetime.now() + timedelta(days=i+1)
            forecasts.append({
                'date': forecast_date.isoformat(),
                'predicted_value': float(pred),
                'period': i + 1,
                'segment': segment_name
            })
        
        return {
            'forecasts': forecasts,
            'segment_name': segment_name,
            'summary': {
                'total_forecast': sum([f['predicted_value'] for f in forecasts]),
                'average_forecast': np.mean([f['predicted_value'] for f in forecasts]),
                'trend': 'increasing' if forecasts[-1]['predicted_value'] > forecasts[0]['predicted_value'] else 'decreasing'
            }
        }
    
    def get_feature_importance(self, top_n=10):
        """Get feature importance from global model"""
        if hasattr(self.global_model, 'feature_importances_'):
            feature_names = self.analyzer.column_info.keys()
            importances = self.global_model.feature_importances_
            
            feature_importance = list(zip(feature_names, importances))
            feature_importance.sort(key=lambda x: x[1], reverse=True)
            
            return feature_importance[:top_n]
        else:
            return []
    
    def generate_forecast_report(self):
        """Generate comprehensive forecast report"""
        if not self.forecast_results:
            return "No forecasts generated yet. Please run forecast() first."
        
        report = {
            'executive_summary': self._generate_executive_summary(),
            'global_insights': self._analyze_global_forecast(),
            'segment_insights': self._analyze_segment_forecasts(),
            'recommendations': self._generate_recommendations(),
            'technical_details': {
                'model_performance': self.model_performance,
                'preprocessing_steps': getattr(self.analyzer, 'transformation_log', []),
                'feature_importance': self.get_feature_importance()
            }
        }
        
        return report
    
    def _generate_executive_summary(self):
        """Generate executive summary of forecasts"""
        global_forecast = self.forecast_results['global_forecast']
        segmented_forecasts = self.forecast_results['segmented_forecasts']
        
        summary = {
            'total_global_forecast': global_forecast['summary']['total_forecast'],
            'average_daily_forecast': global_forecast['summary']['average_forecast'],
            'global_trend': global_forecast['summary']['trend'],
            'number_of_segments': len(segmented_forecasts),
            'best_performing_segment': None,
            'worst_performing_segment': None
        }
        
        if segmented_forecasts:
            segment_totals = {
                segment: data['summary']['total_forecast'] 
                for segment, data in segmented_forecasts.items()
            }
            
            summary['best_performing_segment'] = max(segment_totals, key=segment_totals.get)
            summary['worst_performing_segment'] = min(segment_totals, key=segment_totals.get)
        
        return summary
    
    def _analyze_global_forecast(self):
        """Analyze global forecast patterns"""
        forecasts = self.forecast_results['global_forecast']['forecasts']
        values = [f['predicted_value'] for f in forecasts]
        
        return {
            'forecast_range': {
                'min': min(values),
                'max': max(values),
                'range': max(values) - min(values)
            },
            'volatility': np.std(values),
            'growth_rate': ((values[-1] - values[0]) / values[0]) * 100 if values[0] != 0 else 0
        }
    
    def _analyze_segment_forecasts(self):
        """Analyze segmented forecast patterns"""
        segment_analysis = {}
        
        for segment, data in self.forecast_results['segmented_forecasts'].items():
            forecasts = data['forecasts']
            values = [f['predicted_value'] for f in forecasts]
            
            segment_analysis[segment] = {
                'total_forecast': data['summary']['total_forecast'],
                'trend': data['summary']['trend'],
                'volatility': np.std(values),
                'growth_rate': ((values[-1] - values[0]) / values[0]) * 100 if values[0] != 0 else 0
            }
        
        return segment_analysis
    
    def _generate_recommendations(self):
        """Generate actionable recommendations"""
        recommendations = []
        
        # Global recommendations
        global_trend = self.forecast_results['global_forecast']['summary']['trend']
        if global_trend == 'increasing':
            recommendations.append({
                'type': 'opportunity',
                'message': 'Global forecast shows positive growth trend. Consider scaling operations.',
                'priority': 'medium'
            })
        else:
            recommendations.append({
                'type': 'concern',
                'message': 'Global forecast shows declining trend. Review strategy and market conditions.',
                'priority': 'high'
            })
        
        # Segment-specific recommendations
        segment_analysis = self._analyze_segment_forecasts()
        for segment, analysis in segment_analysis.items():
            if analysis['growth_rate'] > 10:
                recommendations.append({
                    'type': 'opportunity',
                    'message': f'Segment "{segment}" shows strong growth ({analysis["growth_rate"]:.1f}%). Invest more resources.',
                    'priority': 'high'
                })
            elif analysis['growth_rate'] < -10:
                recommendations.append({
                    'type': 'concern',
                    'message': f'Segment "{segment}" shows decline ({analysis["growth_rate"]:.1f}%). Investigate causes.',
                    'priority': 'high'
                })
        
        return recommendations

# Example usage
if __name__ == "__main__":
    # Create sample data
    np.random.seed(42)
    n_samples = 1000
    
    sample_data = {
        'date': pd.date_range('2020-01-01', periods=n_samples, freq='D'),
        'sales': np.random.normal(1000, 200, n_samples),
        'region': np.random.choice(['North', 'South', 'East', 'West'], n_samples),
        'product_category': np.random.choice(['Electronics', 'Clothing', 'Food'], n_samples),
        'marketing_spend': np.random.normal(500, 100, n_samples),
        'temperature': np.random.normal(20, 10, n_samples),
    }
    
    df = pd.DataFrame(sample_data)
    
    # Add realistic relationships
    df['sales'] = df['sales'] + 0.5 * df['marketing_spend'] + np.random.normal(0, 50, n_samples)
    
    # Initialize forecaster
    forecaster = SegmentedForecaster()
    
    # Fit models
    print("Training models...")
    training_results = forecaster.fit_models(
        df, 
        target_column='sales', 
        segmentation_column='region',
        model_type='random_forest'
    )
    
    print("Model Performance:")
    for model_name, metrics in training_results['model_performance'].items():
        print(f"{model_name}: R² = {metrics['r2']:.3f}, RMSE = {metrics['rmse']:.2f}")
    
    # Generate forecasts
    print("\nGenerating forecasts...")
    forecast_results = forecaster.forecast(
        df, 
        target_column='sales', 
        segmentation_column='region',
        forecast_periods=30
    )
    
    # Generate report
    print("\nGenerating comprehensive report...")
    report = forecaster.generate_forecast_report()
    
    print("Executive Summary:")
    exec_summary = report['executive_summary']
    print(f"- Total 30-day forecast: {exec_summary['total_global_forecast']:.2f}")
    print(f"- Average daily forecast: {exec_summary['average_daily_forecast']:.2f}")
    print(f"- Global trend: {exec_summary['global_trend']}")
    print(f"- Best performing segment: {exec_summary['best_performing_segment']}")
    
    print("\nRecommendations:")
    for rec in report['recommendations']:
        print(f"- [{rec['priority'].upper()}] {rec['message']}")
