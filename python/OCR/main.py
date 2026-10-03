from fastapi import FastAPI, File, UploadFile, HTTPException
import easyocr
import shutil
import os
from pdf2image import convert_from_path
from tempfile import NamedTemporaryFile
from pydantic import BaseModel
import platform
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Query
from fastapi.responses import FileResponse
from pdf2docx import Converter
from typing import Optional
import uuid
import logging
from docx import Document
from docx.shared import Inches
import io
import pytesseract
from fastapi import Path
from pymongo import MongoClient
from bson import ObjectId
from bson.json_util import dumps
import os
from dotenv import load_dotenv
from fastapi import Body
from pydantic import BaseModel
from fpdf import FPDF 
from fastapi.responses import FileResponse

load_dotenv()


# Explicitly set Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\tesseract\tesseract.exe"
# Initialize FastAPI
app = FastAPI()
conversion_records = {}  # Simulating a DB


app.add_middleware(
    CORSMiddleware,
 allow_origins=[
    "http://localhost:5000",  # Node.js
    "http://localhost:3000",  # Frontend (optional, only if used)
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for filepath-based OCR
class FilePathRequest(BaseModel):
    filepath: str

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("MONGO_DB_NAME")]
collection = db["documents"]       

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Temporary directory to store uploaded files
UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Supported image formats
SUPPORTED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "image/webp": "webp"
}

class UpdateConversionRequest(BaseModel):
    filename: Optional[str] = None
    isFavorite: Optional[bool] = None  # Add any custom fields you want to allow updating
    convertedDocxPath: Optional[str] = None



# Initialize EasyOCR Reader
reader = easyocr.Reader(["en"])

# Set Poppler path for Windows
POPPLER_PATH = r"C:\poppler\poppler-24.08.0\Library\bin" if platform.system() == "Windows" else None

# OCR function
def perform_ocr(file_path):
    text = reader.readtext(file_path, detail=0)
    return " ".join(text)

# ----------- IMAGE OCR ENDPOINTS -----------

@app.post("/ocr/image/from-path")
async def ocr_image_from_path(request: FilePathRequest):
    file_path = request.filepath

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found at provided path.")

    if not file_path.lower().endswith((".png", ".jpg", ".jpeg")):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .png, .jpg, or .jpeg allowed.")

    try:
        result_text = perform_ocr(file_path)
        return {"text": result_text}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Error processing the image file.")

# ----------- PDF OCR ENDPOINTS -----------

@app.post("/ocr/pdf/from-path")
async def ocr_pdf_from_path(request: FilePathRequest):
    file_path = request.filepath
    print("📩 Received PDF file path:", file_path)

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found at provided path.")

    try:
        images = convert_from_path(file_path, poppler_path=POPPLER_PATH) if POPPLER_PATH else convert_from_path(file_path)
        text_result = ""

        for img in images:
            with NamedTemporaryFile(delete=False, suffix=".png") as img_file:
                temp_path = img_file.name

            img.save(temp_path, "PNG")  # Save after closing temp file
            text_result += perform_ocr(temp_path) + "\n"

            try:
                os.remove(temp_path)
            except Exception as delete_err:
                print(f"⚠️ Failed to delete temp image: {temp_path} — {delete_err}")

        return {"text": text_result.strip()}
    except Exception as e:
        print(f"Error in /ocr/pdf/from-path: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF from path: {str(e)}")
    

@app.post("/ocr/pdf")
async def ocr_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file type. Upload a PDF.")

    try:
        with NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            pdf_path = temp_file.name

        images = convert_from_path(pdf_path, poppler_path=POPPLER_PATH) if POPPLER_PATH else convert_from_path(pdf_path)

        text_result = ""
        temp_image_paths = []

        for i, img in enumerate(images):
            with NamedTemporaryFile(delete=False, suffix=".png") as img_file:
                img_path = img_file.name
                img.save(img_path, "PNG")
                temp_image_paths.append(img_path)

        for img_path in temp_image_paths:
            text_result += perform_ocr(img_path) + "\n"
            os.remove(img_path)

        os.remove(pdf_path)
        return {"text": text_result.strip()}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing the PDF: {str(e)}")

@app.post("/ocr/pdf/from-path")
async def ocr_pdf_from_path(request: FilePathRequest):
    file_path = request.filepath
    print("📩 Received PDF file path:", file_path)

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found at provided path.")

    try:
        images = convert_from_path(file_path, poppler_path=POPPLER_PATH) if POPPLER_PATH else convert_from_path(file_path)
        text_result = ""

        for img in images:
            with NamedTemporaryFile(delete=False, suffix=".png") as img_file:
                temp_path = img_file.name

            img.save(temp_path, "PNG")  # Save after closing temp file
            text_result += perform_ocr(temp_path) + "\n"

            try:
                os.remove(temp_path)
            except Exception as delete_err:
                print(f"⚠️ Failed to delete temp image: {temp_path} — {delete_err}")

        return {"text": text_result.strip()}
    except Exception as e:
        print(f"Error in /ocr/pdf/from-path: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF from path: {str(e)}")

@app.post("/convert-pdf-to-docx")
async def convert_pdf_to_docx(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    pdf_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
    docx_path = os.path.join(UPLOAD_DIR, f"{file_id}.docx")

    try:
        with open(pdf_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=500, detail="PDF save failed")

        # Convert PDF to DOCX
        cv = Converter(pdf_path)
        cv.convert(docx_path, start=0, end=None)
        cv.close()

        if not os.path.exists(docx_path):
            raise HTTPException(status_code=500, detail="DOCX generation failed")

        # ✅ Return .docx file as a response
        return FileResponse(
            docx_path,
            filename="converted.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

    except Exception as e:
        logging.error(f"PDF to DOCX error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

@app.post("/convert-image-to-docx")
async def convert_image_to_docx(file: UploadFile = File(...)):
    try:
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1].lower()

        allowed_exts = [".jpg", ".jpeg", ".png"]
        if file_ext not in allowed_exts:
            raise HTTPException(status_code=400, detail="Only .jpg, .jpeg, and .png files are supported.")

        image_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")
        pdf_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
        docx_path = os.path.join(UPLOAD_DIR, f"{file_id}.docx")

        # Save uploaded file
        with open(image_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Convert to PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.image(image_path, x=10, y=10, w=180)
        pdf.output(pdf_path)

        # OCR and DOCX
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)

        doc = Document()
        doc.add_paragraph(text.strip())
        doc.save(docx_path)

        # Return file content
        return FileResponse(path=docx_path, media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document', filename="converted.docx")

    except Exception as e:
        logging.exception("❌ Conversion error")
        raise HTTPException(status_code=500, detail=str(e))
            
@app.get("/converted-docs/{user_id}")
def get_converted_docs(user_id: str):
    try:
        # Find docs where convertedDocxPath exists and belongs to the user
        docs = list(collection.find({
            "userId": user_id,
            "convertedDocxPath": {"$exists": True, "$ne": ""}
        }))

        if not docs:
            raise HTTPException(status_code=404, detail="No converted documents found.")

        # Optionally: Convert ObjectId to string
        for doc in docs:
            doc["_id"] = str(doc["_id"])

        return docs

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    
@app.patch("/conversion/{file_id}")
async def update_conversion(file_id: str, updatedFile: UploadFile = File(...)):
    if not updatedFile:
        raise HTTPException(status_code=400, detail="No file uploaded")

    # ✅ Ensure the updated_docs directory exists
    os.makedirs("updated_docs", exist_ok=True)

    contents = await updatedFile.read()
    with open(f"./updated_docs/{file_id}.docx", "wb") as f:
        f.write(contents)

    return {"message": "File received and saved"}

@app.get("/")
def read_root():
    return {
        "message": "File Conversion API",
        "endpoints": {
            "/convert-pdf-to-docx/": "Convert PDF to DOCX",
            "/convert-image-to-docx/": "Convert image (JPG/PNG/etc.) to DOCX"
        }
    }


# Add cleanup on shutdown to remove old files
@app.on_event("shutdown")
def cleanup():
    logger.info("Cleaning up temporary files")
    for filename in os.listdir(UPLOAD_DIR):
        file_path = os.path.join(UPLOAD_DIR, filename)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
        except Exception as e:
            logger.error(f"Failed to delete {file_path}: {e}")