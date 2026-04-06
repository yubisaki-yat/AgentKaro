import os
import re
import fitz  # PyMuPDF
from docx import Document
from rake_nltk import Rake
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize

# Ensure nltk data is downloaded
def setup_nltk():
    libs = ['stopwords', 'punkt', 'averaged_perceptron_tagger', 'maxent_ne_chunker', 'words']
    for lib in libs:
        try:
            nltk.data.find(f'corpora/{lib}') if 'corpora' in lib else nltk.data.find(f'tokenizers/{lib}') if 'tokenizers' in lib else nltk.data.find(f'taggers/{lib}')
        except LookupError:
            nltk.download(lib, quiet=True)

setup_nltk()

class ResumeProcessor:
    def __init__(self):
        self.rake = Rake()
        # Technical term markers (common suffixes or patterns)
        self.tech_markers = {
            'developer', 'engineer', 'analyst', 'manager', 'lead', 'senior', 'junior',
            'specialist', 'architect', 'consultant', 'intern', 'script', 'programming',
            'framework', 'library', 'platform', 'cloud', 'data', 'software', 'stack'
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
        """Extract skills and keywords using RAKE and NLP POS tagging."""
        if not text:
            return []

        # 1. RAKE extraction (captures phrases)
        self.rake.extract_keywords_from_text(text)
        rake_candidates = self.rake.get_ranked_phrases()[:30]

        # 2. NLP POS Tagging (captures specific technical nouns)
        tokens = word_tokenize(text)
        tagged = nltk.pos_tag(tokens)
        
        # We want Proper Nouns (NNP) and potentially combined nouns (NN)
        nlp_candidates = []
        stop_words = set(stopwords.words('english'))
        
        for i in range(len(tagged)):
            word, pos = tagged[i]
            # Capture individual proper nouns or capitalized technical terms
            if pos in ['NNP', 'NN'] and word.lower() not in stop_words and len(word) > 1:
                if word[0].isupper() or any(marker in word.lower() for marker in self.tech_markers):
                    nlp_candidates.append(word.strip('.,()'))

        # 3. Frequency Analysis & Filtering
        all_candidates = []
        # Add RAKE phrases first
        for phrase in rake_candidates:
            # Filter out very long phrases or purely numeric ones
            if len(phrase.split()) <= 4 and not phrase.isdigit():
                all_candidates.append(phrase.lower())

        # Add NLP candidates (word-by-word) if they aren't already represented
        for word in nlp_candidates:
            word_lower = word.lower()
            if len(word_lower) > 2 and word_lower not in all_candidates:
                # Basic check to ensure it's not a common English word (if not capitalized)
                if word[0].isupper() or word_lower in self.tech_markers:
                    all_candidates.append(word_lower)

        # 4. Final Deduplication and Selection
        # Use a set for unique items but maintain some order of relevance
        final_list = []
        seen = set()
        
        # Prioritize 2-3 word phrases (often skills) over single words
        for item in all_candidates:
            if item not in seen:
                final_list.append(item)
                seen.add(item)
        
        # Sort by length (longer phrases first usually better skills) then alphabetic
        final_list.sort(key=lambda x: (-len(x.split()), x))

        # Return top 20
        return final_list[:20]

if __name__ == "__main__":
    # Test
    processor = ResumeProcessor()
    test_text = "I am a Senior Software Engineer specializing in Python, React, and Machine Learning. I have experience with AWS and Kubernetes."
    keywords = processor.extract_keywords(test_text)
    print(f"Extracted: {keywords}")
