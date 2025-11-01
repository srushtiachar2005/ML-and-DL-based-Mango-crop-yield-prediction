import mysql.connector
from mysql.connector import Error
from datetime import datetime
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseManager:
    def __init__(self):
        self.host = os.getenv('DB_HOST', 'localhost')
        self.user = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASSWORD', '')
        self.database = os.getenv('DB_NAME', 'farm2value_db')
        self.connection = None
        self.connect()
        self.create_tables()
    
    def connect(self):
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database
            )
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            self.connection = None
    
    def create_tables(self):
        if not self.connection:
            return
        
        cursor = self.connection.cursor()
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Yield predictions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS yield_predictions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                region VARCHAR(100),
                season VARCHAR(50),
                rainfall INT,
                temperature INT,
                humidity INT,
                area FLOAT,
                yield FLOAT,
                yield_per_hectare FLOAT,
                confidence FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_email) REFERENCES users(email)
            )
        """)
        
        # Waste records table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS waste_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                waste_type VARCHAR(100),
                quantity INT,
                location VARCHAR(100),
                estimated_value VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_email) REFERENCES users(email)
            )
        """)
        
        self.connection.commit()
        cursor.close()
    
    def hash_password(self, password):
        return hashlib.sha256(password.encode()).hexdigest()
    
    def register_user(self, name, email, password):
        if not self.connection:
            return False, "Database connection failed"
        
        try:
            cursor = self.connection.cursor()
            hashed_password = self.hash_password(password)
            
            cursor.execute(
                "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)",
                (name, email, hashed_password)
            )
            
            self.connection.commit()
            cursor.close()
            return True, "User registered successfully"
        except Error as e:
            return False, str(e)
    
    def login_user(self, email, password):
        if not self.connection:
            return False, "Database connection failed"
        
        try:
            cursor = self.connection.cursor()
            hashed_password = self.hash_password(password)
            
            cursor.execute(
                "SELECT name, email FROM users WHERE email = %s AND password = %s",
                (email, hashed_password)
            )
            
            result = cursor.fetchone()
            cursor.close()
            
            if result:
                return True, {"name": result[0], "email": result[1]}
            else:
                return False, "Invalid email or password"
        except Error as e:
            return False, str(e)
    
    def save_yield_prediction(self, user_email, region, season, rainfall, temperature, humidity, area, yield_result):
        if not self.connection:
            return False, "Database connection failed"
        
        try:
            cursor = self.connection.cursor()
            
            cursor.execute("""
                INSERT INTO yield_predictions 
                (user_email, region, season, rainfall, temperature, humidity, area, yield, yield_per_hectare, confidence)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (user_email, region, season, rainfall, temperature, humidity, area, 
                  yield_result['yield'], yield_result['yield_per_hectare'], yield_result['confidence']))
            
            self.connection.commit()
            cursor.close()
            return True, "Prediction saved"
        except Error as e:
            return False, str(e)
    
    def save_waste_record(self, user_email, waste_type, quantity, location, estimated_value):
        if not self.connection:
            return False, "Database connection failed"
        
        try:
            cursor = self.connection.cursor()
            
            cursor.execute("""
                INSERT INTO waste_records 
                (user_email, waste_type, quantity, location, estimated_value)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_email, waste_type, quantity, location, estimated_value))
            
            self.connection.commit()
            cursor.close()
            return True, "Waste record saved"
        except Error as e:
            return False, str(e)
    
    def get_user_predictions(self, user_email):
        if not self.connection:
            return []
        
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(
                "SELECT * FROM yield_predictions WHERE user_email = %s ORDER BY created_at DESC",
                (user_email,)
            )
            results = cursor.fetchall()
            cursor.close()
            return results
        except Error as e:
            print(f"Error fetching predictions: {e}")
            return []
    
    def close(self):
        if self.connection:
            self.connection.close()
