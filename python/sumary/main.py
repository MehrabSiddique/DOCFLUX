from fastapi import FastAPI
from pydantic import BaseModel
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.text_rank import TextRankSummarizer
import nltk
import os
import yake
import markdown
from bs4 import BeautifulSoup

# ✅ 1. Set the NLTK data folder
NLTK_PATH = os.path.join(os.path.expanduser("~"), "nltk_data")
os.makedirs(NLTK_PATH, exist_ok=True)
nltk.data.path.append(NLTK_PATH)

# ✅ 2. Download both punkt and punkt_tab if not already present
for resource in ['punkt', 'punkt_tab']:
    try:
        nltk.data.find(f"tokenizers/{resource}")
    except LookupError:
        nltk.download(resource, download_dir=NLTK_PATH)

# ✅ 3. FastAPI setup
app = FastAPI(title="Text Processing API", description="Keyword Extraction & Summarization using FastAPI")

class TextRequest(BaseModel):
    text: str

@app.post("/summarize/")
def summarize_text(request: TextRequest):
    try:
        text = request.text.strip()
        
        # Short text threshold
        if len(text.split()) <= 5:
            return {"summary": request.text}
        
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        summarizer = TextRankSummarizer()
        summary = summarizer(parser.document, len(parser.document.sentences) // 2)

        return {"summary": " ".join(str(sentence) for sentence in summary)}
    
    except Exception as e:
        print("Error:", e)
        return {"error": str(e)}

@app.post("/keywords/")
def extract_keywords(request: TextRequest):
    """ Extract keywords using YAKE, prioritizing bold phrases in Markdown """

    # Step 1: Convert Markdown to HTML
    html = markdown.markdown(request.text)

    # Step 2: Parse HTML and extract bold content
    soup = BeautifulSoup(html, "html.parser")
    bold_tags = soup.find_all(['b', 'strong']) + soup.find_all("span", style=lambda s: s and "bold" in s)
    bold_phrases = list({tag.get_text(strip=True) for tag in bold_tags if tag.get_text(strip=True)})

    # Step 3: Extract clean text for YAKE keyword extraction
    clean_text = soup.get_text()

    # Step 4: Run YAKE to get top keywords (excluding bold ones to prevent duplication)
    kw_extractor = yake.KeywordExtractor(lan="en", n=2, top=10)  # Adjust n for phrases
    extracted = kw_extractor.extract_keywords(clean_text)
    extracted_keywords = [kw[0] for kw in extracted if kw[0] not in bold_phrases]

    # Step 5: Combine bold phrases (priority) with YAKE keywords (limit total to 5)
    total_limit = 5
    combined_keywords = bold_phrases + extracted_keywords
    final_keywords = combined_keywords[:total_limit]

    return {"keywords": final_keywords}

# Endpoint to summarize the text (GET request)
###@app.get("/summarize/")
#def summarize_text(text: str):
   # try:
      #  text = text.strip()
        
        # Define a threshold for short text
       # SHORT_TEXT_THRESHOLD = 5  # Word count below which text will not be summarized
        
        # If the text is short, return it as is
       # if len(text.split()) <= SHORT_TEXT_THRESHOLD:
           # return {"summary": text}
        
        # Otherwise, summarize the text
       # parser = PlaintextParser.from_string(text, Tokenizer("english"))
       # summarizer = TextRankSummarizer()  # Using TextRank for better context
        
        # Generate a summary dynamically based on the text length
       # summary = summarizer(parser.document, len(parser.document.sentences) // 2)  # Summarize 50% of the text
        
       # return {"summary": " ".join(str(sentence) for sentence in summary)}

   # except Exception as e:
      #  print("Error:", e)  # Print the error in logs
       # return {"error": str(e)}

# Endpoint to extract keywords (GET request)
@app.get("/keywords/")
def extract_keywords(text: str):
    """ Extract keywords using YAKE """
    kw_extractor = yake.KeywordExtractor(lan="en", n=2, top=5)  # Extract top 5 keywords
    keywords = kw_extractor.extract_keywords(text)

    return {"keywords": [kw[0] for kw in keywords]}  # Extract only words, not scor