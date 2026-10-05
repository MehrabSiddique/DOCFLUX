# DOCFLUX
#  AI Document Management System

An AI-powered document management system for uploading, processing, converting, summarizing, and organizing **PDF and image-based documents**.

The system combines a **Next.js frontend**, **Node.js backend**, and **FastAPI AI-processing service** to create an end-to-end document processing workflow.

---

##  Overview

The system allows users to:

* Upload PDF and image documents
* Crop images before processing
* Store uploaded files in Google Drive
* Store document metadata in a database
* Extract text from images/PDFs using OCR
* Convert extracted content into DOCX documents
* Generate document summaries
* Extract important keywords
* Store processed information for future retrieval

The project demonstrates the integration of **web development, cloud storage, document processing, OCR, NLP, and AI services** into a single application.

---

##  System Architecture

```text
                    ┌──────────────────────┐
                    │      Next.js         │
                    │     Frontend         │
                    └──────────┬───────────┘
                               │
                               │ API Requests
                               ▼
                    ┌──────────────────────┐
                    │      Node.js         │
                    │      Backend         │
                    │   REST API / Auth    │
                    └───────┬───────┬──────┘
                            │       │
                ┌───────────┘       └─────────────┐
                ▼                                 ▼
       ┌─────────────────┐                ┌─────────────────┐
       │    Database     │                │   Google Drive  │
       │ Metadata / Text │                │ File Storage    │
       └─────────────────┘                └─────────────────┘
                            │
                            ▼
                   ┌──────────────────────┐
                   │       FastAPI       │
                   │   AI Processing     │
                   └──────────┬───────────┘
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
          OCR / Text      Summarization   Keyword Extraction
          Extraction
             │                │                │
             └────────────────┼────────────────┘
                              ▼
                       Processed Results
                              │
                              ▼
                         Database
```

---

##  Key Features

###  Document Upload

Users can upload:

* PDF documents
* Images

The uploaded documents are processed through the application and their metadata is stored in the database.

###  Image Cropping

For image-based documents, users can crop the image before sending it for further processing.

This can help remove unnecessary portions of an image and focus OCR processing on the relevant document area.

###  Google Drive Storage

Uploaded documents can be stored in **Google Drive**, allowing the application to keep the original files in cloud storage while maintaining their metadata in the application database.

###  OCR — Optical Character Recognition

The FastAPI service processes image/PDF content using OCR to extract machine-readable text from documents.

The extracted text can then be stored in the database and used for subsequent processing.

```text
Image / PDF
     ↓
    OCR
     ↓
Extracted Text
     ↓
Database
```

###  DOCX Conversion

Extracted document content can be converted into a **DOCX document**.

```text
Original Document
       ↓
      OCR
       ↓
Extracted Text
       ↓
DOCX Conversion
       ↓
Generated Document
```

The generated document can then be stored and associated with the original uploaded document.

###  Automatic Summarization

The extracted document text is processed by the FastAPI service to generate a concise summary.

This allows users to quickly understand the main content of lengthy documents without reading the entire document.

###  Keyword Extraction

Important keywords are automatically extracted from the document text.

The keywords can be used to:

* Identify important topics
* Categorize documents
* Improve document organization
* Support future search functionality

###  Database Management

The application stores document-related information such as:

* Original document information
* File references
* Extracted text
* Generated document information
* Summaries
* Keywords
* Processing information

---

#  Document Processing Workflow

The complete workflow can be represented as:

```text
User
 │
 ▼
Upload PDF / Image
 │
 ▼
Crop Image (if required)
 │
 ▼
Store Original File
 │
 ├──────────────► Google Drive
 │
 ▼
Node.js Backend
 │
 ▼
FastAPI Processing Service
 │
 ├──► OCR
 │      │
 │      ▼
 │   Extracted Text
 │
 ├──► DOCX Conversion
 │      │
 │      ▼
 │   Generated DOCX
 │
 ├──► Summarization
 │      │
 │      ▼
 │   Document Summary
 │
 └──► Keyword Extraction
        │
        ▼
     Keywords
        │
        ▼
     Database
```

---

#  Technology Stack

## Frontend

### Next.js

Used to build the user interface and frontend application.

Responsibilities include:

* Document upload interface
* Image cropping interface
* Document management UI
* Displaying extracted text
* Displaying summaries and keywords
* Communicating with the backend APIs

---

## Backend

### Node.js

Acts as the main application backend.

Responsibilities include:

* API handling
* Application logic
* User/document management
* Communication with the database
* Communication with Google Drive
* Communication with the FastAPI processing service

---

## AI / Document Processing Service

### FastAPI

FastAPI provides a separate Python-based service responsible for document intelligence and processing.

It handles operations such as:

* OCR
* Text extraction
* Document conversion
* Summarization
* Keyword extraction

Separating these services allows the JavaScript backend and Python-based AI/document-processing components to work independently.

---

## Database

The database stores application and document-processing information, including extracted text, summaries, keywords, and document metadata.

---

## Cloud Storage

### Google Drive

Used to store uploaded/original documents separately from application metadata.

---

#  AI & NLP Components

The project combines several AI/NLP-related tasks:

### 1. OCR

Converts text contained in images or scanned documents into machine-readable text.

```text
Image
  ↓
OCR
  ↓
Machine-readable text
```

### 2. Text Summarization

Processes extracted text and generates a shorter representation containing the important information.

### 3. Keyword Extraction

Identifies important words or phrases that represent the main topics of the document.

### 4. Document Conversion

Transforms processed/extracted document content into a structured DOCX format.

---

#  Service Communication

The architecture separates the application into different services:

```text
Next.js
   │
   │ HTTP/API
   ▼
Node.js
   │
   │ HTTP/API
   ▼
FastAPI
   │
   ├── OCR
   ├── Summarization
   ├── Keyword Extraction
   └── DOCX Conversion
```

This separation makes it possible to use Python's document-processing and machine-learning ecosystem while keeping the primary application backend in Node.js.

---

#  Project Objectives

The main objectives of the project are:

* Build an end-to-end intelligent document management workflow
* Automate text extraction from scanned documents
* Reduce manual document processing
* Generate summaries automatically
* Extract important document keywords
* Convert processed content into editable DOCX documents
* Store and organize processed document information
* Integrate cloud storage with an application database
* Demonstrate integration between JavaScript and Python-based services

---

#  Skills Demonstrated

This project demonstrates experience with:

* Full-stack web development
* Next.js
* Node.js
* REST APIs
* FastAPI
* Python
* OCR
* Natural Language Processing
* Text summarization
* Keyword extraction
* Document processing
* DOCX generation
* Database design
* Cloud storage integration
* API integration

---

#  Future Improvements

Potential future improvements include:

* Semantic document search
* Vector database integration
* Embedding-based document retrieval
* Question answering over uploaded documents
* RAG-based document assistant
* Automatic document classification
* Duplicate document detection
* Multi-language OCR
* User-specific document permissions
* Document version control
* Advanced document analytics

---


