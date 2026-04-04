import os
import re
import fitz  # PyMuPDF
from docx import Document
from rake_nltk import Rake
import nltk

# Ensure nltk data is downloaded
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

class ResumeProcessor:
    def __init__(self):
        self.rake = Rake()
        # Common tech keywords to prioritize
        self.skill_db = {
            'python', 'javascript', 'react', 'node', 'express', 'fastapi', 'flask',
            'django', 'sql', 'nosql', 'mongodb', 'postgresql', 'aws', 'azure', 'docker',
            'kubernetes', 'java', 'spring', 'go', 'rust', 'c++', 'c#', 'php', 'laravel',
            'tailwinds', 'css', 'html', 'typescript', 'android', 'ios', 'flutter',
            'selenium', 'automation', 'devops', 'machine learning', 'data science',
            'frontend', 'backend', 'fullstack', 'qa', 'analyst', 'developer', 'engineer'
        }

    def extract_text(self, file_path):
        """Extract text from PDF or DOCX."""
        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.pdf':
            return self._extract_from_pdf(file_path)
        elif ext == '.docx':
            return self._extract_from_docx(file_path)
        else:
            return ""

    def _extract_from_pdf(self, file_path):
        text = ""
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
            doc.close()
        except Exception as e:
            print(f"Error extracting PDF: {e}")
        return text

    def _extract_from_docx(self, file_path):
        text = ""
        try:
            doc = Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            print(f"Error extracting DOCX: {e}")
        return text

    def extract_keywords(self, text):
        """Extract skills and keywords using RAKE and skill DB."""
        if not text:
            return []

        # 1. RAKE extraction
        self.rake.extract_keywords_from_text(text)
        rake_keywords = self.rake.get_ranked_phrases()[:15]

        # 2. Skill DB matching (Exact matches + partials)
        matched_skills = set()
        words = re.findall(r'\b\w+\b', text.lower())
        for word in words:
            if word in self.skill_db:
                matched_skills.add(word)

        # 3. Combine and filter
        # Prioritize matched skills, then top rake keywords
        combined = list(matched_skills)
        for kw in rake_keywords:
            if len(combined) >= 10:
                break
            if kw.lower() not in combined:
                combined.append(kw)

        return combined

if __name__ == "__main__":
    # Test
    processor = ResumeProcessor()
    # Mock text
    test_text = "I am a Senior Python Developer with experience in React and FastAPI. I know Docker and SQL."
    keywords = processor.extract_keywords(test_text)
    print(f"Extracted: {keywords}")
