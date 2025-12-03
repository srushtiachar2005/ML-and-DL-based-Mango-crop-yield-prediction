from flask import Flask, request, render_template, redirect, url_for
from werkzeug.utils import secure_filename
import os

UPLOAD_FOLDER = "uploads"
ALLOWED_EXT = {"png","jpg","jpeg","gif"}

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".",1)[1].lower() in ALLOWED_EXT

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload():
    if "image" not in request.files:
        return "No file part", 400
    file = request.files["image"]
    if file.filename == "":
        return "No selected file", 400
    if file and allowed_file(file.filename):
        fname = secure_filename(file.filename)
        save_path = os.path.join(app.config["UPLOAD_FOLDER"], fname)
        file.save(save_path)
        return f"Saved to {save_path}"
    return "File type not allowed", 400

if __name__ == "__main__":
    app.run(debug=True, port=4000)
