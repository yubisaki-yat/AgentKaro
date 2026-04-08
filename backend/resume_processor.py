import os
import re
import fitz  # PyMuPDF
from docx import Document
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
try:
    from rake_nltk import Rake
except ImportError:
    Rake = None

# Ensure nltk data is downloaded
def setup_nltk():
    libs = ['stopwords', 'punkt', 'averaged_perceptron_tagger', 'maxent_ne_chunker', 'words', 'punkt_tab']
    # Add common local paths for Windows
    home = os.path.expanduser('~')
    nltk_paths = [
        os.path.join(home, 'AppData', 'Roaming', 'nltk_data'),
        os.path.join(os.getcwd(), 'nltk_data')
    ]
    for p in nltk_paths:
        if p not in nltk.data.path:
            nltk.data.path.append(p)

    for lib in libs:
        try:
            nltk.data.find(lib)
        except (LookupError, OSError):
            try:
                print(f"[PROCESSOR] Downloading NLTK data: {lib}...")
                nltk.download(lib, quiet=True)
            except Exception as e:
                print(f"[WARNING] NLTK download failed for '{lib}': {e}")

setup_nltk()

class ResumeProcessor:
    def __init__(self):
        self.use_nlp = False
        try:
            if Rake:
                self.rake = Rake()
                self.use_nlp = True
            else:
                print("[WARNING] Rake-NLTK not installed. Using fallback.")
        except Exception as e:
            print(f"[WARNING] RAKE initialization failed: {e}. Using fallback.")

        # Technical term markers (common suffixes or patterns)
        self.tech_markers = {
            'developer', 'engineer', 'analyst', 'manager', 'lead', 'senior', 'junior',
            'specialist', 'architect', 'consultant', 'intern', 'script', 'programming',
            'framework', 'library', 'platform', 'cloud', 'data', 'software', 'stack',
            'frontend', 'backend', 'fullstack', 'devops', 'security', 'automated'
        }

    def extract_text(self, file_path):
        """Extract text from PDF or DOCX."""
        if not os.path.exists(file_path):
            print(f"[ERROR] File not found: {file_path}")
            return ""
            
        ext = os.path.splitext(file_path)[1].lower()
        try:
            if ext == '.pdf':
                return self._extract_from_pdf(file_path)
            elif ext == '.docx':
                return self._extract_from_docx(file_path)
            else:
                print(f"[WARNING] Unsupported file extension: {ext}")
                return ""
        except Exception as e:
            print(f"[ERROR] Unexpected error during text extraction: {e}")
            return ""

    def _extract_from_pdf(self, file_path):
        text = ""
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
            doc.close()
        except Exception as e:
            print(f"Error extracting PDF '{file_path}': {e}")
        return text

    def _extract_from_docx(self, file_path):
        text = ""
        try:
            doc = Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            print(f"Error extracting DOCX '{file_path}': {e}")
        return text

    def extract_keywords(self, text):
        """Extract skills and keywords using available robust methods."""
        if not text:
            return []

        if not self.use_nlp:
            return self.fallback_extract_keywords(text)

        try:
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
        except Exception as e:
            print(f"[WARNING] NLP Keyword extraction failed: {e}. using fallback.")
            return self.fallback_extract_keywords(text)

    def fallback_extract_keywords(self, text):
        """Simple regex-based extraction as a fallback when NLP libraries fail."""
        # Look for capitalized words or words containing numbers/special chars common in tech (e.g. C++, Node.js)
        # Also look for known technical markers
        words = re.findall(r'\b[A-Z][a-zA-Z0-9+#.]+\b|\b[a-zA-Z]+[0-9]+[a-zA-Z0-9]*\b', text)
        
        # Add words that match tech markers even if not capitalized
        text_lower = text.lower()
        for marker in self.tech_markers:
            if marker in text_lower:
                words.append(marker)
        
        # Deduplicate and basic filtering
        seen = set()
        final = []
        for w in words:
            w_clean = w.lower().strip('.,() ')
            if len(w_clean) > 1 and w_clean not in seen:
                final.append(w_clean)
                seen.add(w_clean)
                
        return final[:20]

if __name__ == "__main__":
    # Test
    processor = ResumeProcessor()
    test_text = "I am a Senior Software Engineer specializing in Python, React, and Machine Learning. I have experience with AWS and Kubernetes."
    keywords = processor.extract_keywords(test_text)
    print(f"Extracted: {keywords}")
