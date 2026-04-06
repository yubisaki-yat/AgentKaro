import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from backend.resume_processor import ResumeProcessor

def test_extraction():
    processor = ResumeProcessor()
    
    # Test text containing single and multi-word keywords
    test_text = """
    John Doe
    Full Stack Developer specializing in Machine Learning and Artificial Intelligence.
    Proficient in Python, React, and FastAPI.
    Experienced with AWS, Docker, and Kubernetes.
    Skilled in Data Science and Deep Learning.
    Also familiar with Cybersecurity and Cloud Computing.
    """
    
    print("Testing Keyword Extraction...")
    keywords = processor.extract_keywords(test_text)
    print(f"Extracted Keywords: {keywords}")
    
    expected = [
        'artificial intelligence', 'aws', 'backend', 'cloud computing', 
        'cybersecurity', 'data science', 'deep learning', 'developer', 
        'docker', 'fastapi', 'frontend', 'full stack', 'fullstack', 
        'kubernetes', 'machine learning', 'python', 'react'
    ]
    
    # Check for specific multi-word skills
    multi_word_skills = ['machine learning', 'artificial intelligence', 'data science', 'full stack', 'deep learning']
    
    missing = [s for s in multi_word_skills if s not in keywords]
    if not missing:
        print("✅ SUCCESS: All multi-word skills extracted!")
    else:
        print(f"❌ FAIL: Missing multi-word skills: {missing}")

if __name__ == "__main__":
    test_extraction()
