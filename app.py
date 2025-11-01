import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime
import folium
from streamlit_folium import st_folium
import plotly.graph_objects as go
import os
from dotenv import load_dotenv
from database import DatabaseManager

load_dotenv()

# Initialize database
db = DatabaseManager()

# Configure Streamlit
st.set_page_config(
    page_title="Farm2Value",
    page_icon="🌾",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for green and mango-yellow theme
st.markdown("""
<style>
    :root {
        --primary-green: #22c55e;
        --mango-yellow: #fbbf24;
        --dark-green: #15803d;
        --light-green: #dcfce7;
        --gray-dark: #1f2937;
        --gray-light: #f3f4f6;
    }
    
    .main {
        background-color: var(--gray-light);
    }
    
    .stButton > button {
        background-color: var(--primary-green);
        color: white;
        border-radius: 8px;
        padding: 10px 24px;
        font-weight: 600;
        border: none;
    }
    
    .stButton > button:hover {
        background-color: var(--dark-green);
    }
    
    .metric-card {
        background-color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border-left: 4px solid var(--primary-green);
    }
    
    .header-section {
        background: linear-gradient(135deg, var(--primary-green) 0%, var(--dark-green) 100%);
        padding: 30px;
        border-radius: 12px;
        color: white;
        margin-bottom: 30px;
    }
    
    .waste-card {
        background-color: white;
        padding: 15px;
        border-radius: 8px;
        border: 2px solid var(--mango-yellow);
        margin-bottom: 10px;
    }
</style>
""", unsafe_allow_html=True)

if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
    st.session_state.user_name = ""
    st.session_state.user_email = ""
    st.session_state.current_page = "home"

# Load waste database
WASTE_DATABASE = {
    "Mango Peel": {
        "description": "Outer skin of mangoes",
        "uses": ["Compost", "Animal feed", "Pectin extraction"],
        "process": "Dry and ferment for 2-3 weeks, then mix with soil",
        "price_per_kg": "₹5-10",
        "industries": ["Composting units", "Pectin manufacturers", "Livestock farms"]
    },
    "Mango Seed": {
        "description": "Pit/kernel from mango",
        "uses": ["Flour production", "Oil extraction", "Activated charcoal"],
        "process": "Dry seeds, grind into flour or extract oil",
        "price_per_kg": "₹15-25",
        "industries": ["Food processing", "Oil mills", "Chemical plants"]
    },
    "Mango Husk": {
        "description": "Dried mango leaves and branches",
        "uses": ["Biofuel", "Animal bedding", "Mulch"],
        "process": "Dry completely, can be used directly as mulch",
        "price_per_kg": "₹8-12",
        "industries": ["Biofuel plants", "Dairy farms", "Nurseries"]
    },
    "Sugarcane Bagasse": {
        "description": "Fibrous residue from sugarcane processing",
        "uses": ["Biofuel", "Paper production", "Animal feed"],
        "process": "Compress and dry for fuel use",
        "price_per_kg": "₹3-6",
        "industries": ["Sugar mills", "Paper factories", "Power plants"]
    },
    "Paddy Straw": {
        "description": "Leftover rice crop residue",
        "uses": ["Compost", "Building material", "Biofuel"],
        "process": "Chop and compost or use for mushroom farming",
        "price_per_kg": "₹4-8",
        "industries": ["Composting units", "Brick manufacturers", "Biofuel plants"]
    },
    "Corn Husk": {
        "description": "Outer covering of corn cobs",
        "uses": ["Biofuel", "Animal feed", "Mulch"],
        "process": "Dry and store for fuel or animal bedding",
        "price_per_kg": "₹6-10",
        "industries": ["Biofuel plants", "Livestock farms", "Nurseries"]
    },
    "Coconut Shell": {
        "description": "Hard shell from coconuts",
        "uses": ["Activated charcoal", "Biofuel", "Handicrafts"],
        "process": "Burn slowly or process for charcoal production",
        "price_per_kg": "₹12-18",
        "industries": ["Charcoal manufacturers", "Energy plants", "Craft units"]
    },
    "Groundnut Shell": {
        "description": "Shell remaining after groundnut harvest",
        "uses": ["Biofuel", "Mulch", "Animal bedding"],
        "process": "Dry completely and use directly",
        "price_per_kg": "₹5-9",
        "industries": ["Oil mills", "Biofuel plants", "Farms"]
    },
    "Cotton Stalks": {
        "description": "Leftover after cotton harvest",
        "uses": ["Biofuel", "Compost", "Paper"],
        "process": "Shred and compost or use for fuel",
        "price_per_kg": "₹7-11",
        "industries": ["Cotton mills", "Composting units", "Biofuel plants"]
    },
    "Vegetable Waste": {
        "description": "Peels, leaves, and rejected vegetables",
        "uses": ["Compost", "Biogas", "Animal feed"],
        "process": "Collect, chop, and compost within 1-2 weeks",
        "price_per_kg": "₹2-5",
        "industries": ["Biogas plants", "Farms", "Composting units"]
    }
}

# Location-based industries database
INDUSTRIES_BY_LOCATION = {
    "Bangalore": [
        {"name": "Green Compost Solutions", "type": "Composting", "lat": 12.9716, "lng": 77.5946, "phone": "080-XXXX-XXXX"},
        {"name": "Bangalore Biofuel Ltd", "type": "Biofuel", "lat": 12.9352, "lng": 77.6245, "phone": "080-XXXX-XXXX"},
        {"name": "Organic Waste Management", "type": "Recycling", "lat": 13.0827, "lng": 77.6066, "phone": "080-XXXX-XXXX"}
    ],
    "Mysore": [
        {"name": "Mysore Bio Industries", "type": "Biofuel", "lat": 12.2958, "lng": 76.6394, "phone": "0821-XXXX-XXXX"},
        {"name": "Green Earth Composting", "type": "Composting", "lat": 12.2942, "lng": 76.6399, "phone": "0821-XXXX-XXXX"}
    ],
    "Tumkur": [
        {"name": "Tumkur Agricultural Waste", "type": "Processing", "lat": 13.2176, "lng": 77.1146, "phone": "0816-XXXX-XXXX"},
        {"name": "Agro Energy Ltd", "type": "Biofuel", "lat": 13.2150, "lng": 77.1120, "phone": "0816-XXXX-XXXX"}
    ],
    "Hassan": [
        {"name": "Hassan Green Waste", "type": "Composting", "lat": 13.2018, "lng": 75.9855, "phone": "08172-XXXX-XXXX"}
    ]
}

def predict_yield(region, season, rainfall, temperature, humidity, area):
    """Mock ML model for yield prediction"""
    base_yield = 25
    
    rainfall_factor = (rainfall / 800) * 0.3
    temp_factor = (1 - abs(temperature - 28) / 50) * 0.3
    humidity_factor = (humidity / 70) * 0.2
    seasonal_factor = {"Summer": 0.9, "Monsoon": 1.1, "Winter": 0.8}.get(season, 1.0)
    
    adjusted_yield = base_yield * (1 + rainfall_factor + temp_factor + humidity_factor) * seasonal_factor
    adjusted_yield = max(10, min(50, adjusted_yield))
    
    confidence = min(95, 70 + (rainfall_factor + temp_factor + humidity_factor) * 50)
    
    return {
        "yield": round(adjusted_yield * area, 2),
        "yield_per_hectare": round(adjusted_yield, 2),
        "confidence": round(confidence, 1),
        "area": area
    }

def login_page():
    """Login page with authentication"""
    st.markdown("""
    <div class="header-section">
        <h1>🌾 Farm2Value</h1>
        <p>AI-Powered Agricultural Solutions for Sustainable Farming</p>
    </div>
    """, unsafe_allow_html=True)
    
    tab1, tab2 = st.tabs(["Login", "Register"])
    
    with tab1:
        st.markdown("### Sign In")
        
        col1, col2 = st.columns([1, 1])
        
        with col1:
            st.write("Enter your credentials to access your account")
        
        with col2:
            email = st.text_input("Email", key="login_email", placeholder="your@email.com")
            password = st.text_input("Password", type="password", key="login_password", placeholder="Enter password")
            
            if st.button("Login", use_container_width=True):
                if email and password:
                    success, result = db.login_user(email, password)
                    if success:
                        st.session_state.logged_in = True
                        st.session_state.user_name = result['name']
                        st.session_state.user_email = result['email']
                        st.session_state.current_page = "dashboard"
                        st.rerun()
                    else:
                        st.error(result)
                else:
                    st.error("Please enter both email and password")
    
    with tab2:
        st.markdown("### Create New Account")
        
        name = st.text_input("Full Name", key="register_name", placeholder="Your name")
        email = st.text_input("Email", key="register_email", placeholder="your@email.com")
        password = st.text_input("Password", type="password", key="register_password", placeholder="Create password")
        confirm_password = st.text_input("Confirm Password", type="password", key="register_confirm", placeholder="Confirm password")
        
        if st.button("Register", use_container_width=True):
            if name and email and password and confirm_password:
                if password != confirm_password:
                    st.error("Passwords do not match")
                else:
                    success, message = db.register_user(name, email, password)
                    if success:
                        st.success(message)
                        st.info("Registration successful! Please login with your credentials.")
                    else:
                        st.error(f"Registration failed: {message}")
            else:
                st.error("Please fill in all fields")

def dashboard_page():
    """Main dashboard page"""
    with st.sidebar:
        st.markdown(f"### Welcome, {st.session_state.user_name}!")
        st.divider()
        
        page = st.radio("Select Feature", ["Dashboard", "Yield Prediction", "Waste Recommendations"], index=0)
        
        st.divider()
        if st.button("Logout", use_container_width=True):
            st.session_state.logged_in = False
            st.session_state.user_name = ""
            st.session_state.user_email = ""
            st.rerun()
    
    if page == "Dashboard":
        show_dashboard()
    elif page == "Yield Prediction":
        show_yield_prediction()
    elif page == "Waste Recommendations":
        show_waste_recommendations()

def show_dashboard():
    """Dashboard home page"""
    st.markdown("""
    <div class="header-section">
        <h1>📊 Farm2Value Dashboard</h1>
        <p>Your complete agricultural management platform</p>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        <div class="waste-card">
            <h3>🌾 Yield Prediction</h3>
            <p>Get AI-powered mango yield predictions based on weather, climate, and soil conditions.</p>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("Go to Yield Prediction →", use_container_width=True, key="yield_btn"):
            st.rerun()
    
    with col2:
        st.markdown("""
        <div class="waste-card">
            <h3>♻️ Waste Recommendations</h3>
            <p>Convert agricultural waste into valuable resources and connect with local buyers.</p>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("Go to Waste Recommendations →", use_container_width=True, key="waste_btn"):
            st.rerun()

def show_yield_prediction():
    """Yield prediction page"""
    st.markdown("""
    <div class="header-section">
        <h2>🌾 Mango Yield Prediction</h2>
        <p>Get accurate yield predictions using AI and weather data</p>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Enter Farm Details")
        
        region = st.selectbox("Region", ["Bangalore", "Mysore", "Tumkur", "Hassan", "Belgaum", "Bijapur"])
        season = st.selectbox("Season", ["Summer", "Monsoon", "Winter"])
        rainfall = st.slider("Rainfall (mm)", 200, 1200, 800)
        
    with col2:
        temperature = st.slider("Temperature (°C)", 15, 40, 28)
        humidity = st.slider("Humidity (%)", 30, 95, 70)
        area = st.number_input("Farm Area (hectares)", min_value=0.5, max_value=100.0, value=5.0, step=0.5)
    
    if st.button("Predict Yield", use_container_width=True):
        with st.spinner("Analyzing data..."):
            result = predict_yield(region, season, rainfall, temperature, humidity, area)
            
            db.save_yield_prediction(st.session_state.user_email, region, season, rainfall, temperature, humidity, area, result)
            
            st.success("✓ Prediction Complete!")
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("Estimated Yield", f"{result['yield']} tons", f"({result['yield_per_hectare']} tons/ha)")
            
            with col2:
                st.metric("Confidence Level", f"{result['confidence']}%")
            
            with col3:
                st.metric("Farm Area", f"{result['area']} ha")
            
            st.divider()
            
            st.subheader("📈 Detailed Analysis")
            st.write(f"""
            - **Region:** {region}
            - **Season:** {season}
            - **Rainfall:** {rainfall}mm
            - **Temperature:** {temperature}°C
            - **Humidity:** {humidity}%
            
            Based on the analysis, your farm is expected to produce approximately **{result['yield']} tons** 
            of mangoes with a **{result['confidence']}% confidence level**.
            """)

def show_waste_recommendations():
    """Waste recommendations page"""
    st.markdown("""
    <div class="header-section">
        <h2>♻️ Agricultural Waste Reuse Advisor</h2>
        <p>Transform your agricultural waste into valuable resources</p>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        waste_type = st.selectbox("Select Waste Type", list(WASTE_DATABASE.keys()))
    
    with col2:
        quantity = st.number_input("Quantity (kg)", min_value=1, value=100, step=10)
    
    location = st.selectbox("Your Location", ["Bangalore", "Mysore", "Tumkur", "Hassan", "Other"])
    
    if st.button("Get Recommendations", use_container_width=True):
        waste_info = WASTE_DATABASE.get(waste_type)
        
        estimated_value = f"{waste_info['price_per_kg']} per kg"
        db.save_waste_record(st.session_state.user_email, waste_type, quantity, location, estimated_value)
        
        st.success("✓ Recommendations Found!")
        
        st.subheader(f"💡 {waste_type} - Reuse Options")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown(f"""
            **Description:** {waste_info['description']}
            
            **Estimated Value:** {waste_info['price_per_kg']} per kg
            **Estimated Total Value:** ₹{quantity * int(waste_info['price_per_kg'].split('-')[0].replace('₹', ''))} - ₹{quantity * int(waste_info['price_per_kg'].split('-')[1].replace('₹', ''))}
            """)
        
        with col2:
            st.markdown(f"""
            **Processing Method:**
            {waste_info['process']}
            """)
        
        st.divider()
        
        st.subheader("🎯 Recommended Uses")
        for i, use in enumerate(waste_info['uses'], 1):
            st.write(f"{i}. {use}")
        
        st.divider()
        
        if location != "Other":
            st.subheader(f"🏭 Industries in {location}")
            
            industries = INDUSTRIES_BY_LOCATION.get(location, [])
            
            if industries:
                m = folium.Map(location=[industries[0]['lat'], industries[0]['lng']], zoom_start=10)
                
                for industry in industries:
                    folium.Marker(
                        location=[industry['lat'], industry['lng']],
                        popup=f"{industry['name']}<br>{industry['type']}<br>{industry['phone']}",
                        tooltip=industry['name'],
                        icon=folium.Icon(color='green', icon='industry')
                    ).add_to(m)
                
                st_folium(m, width=700, height=400)
                
                st.write("")
                for industry in industries:
                    st.markdown(f"""
                    **{industry['name']}**
                    - Type: {industry['type']}
                    - Contact: {industry['phone']}
                    """)

# Main app logic
if st.session_state.logged_in:
    dashboard_page()
else:
    login_page()
