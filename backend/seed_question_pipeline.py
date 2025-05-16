#!/usr/bin/env python
# filepath: /Users/ngocp/Documents/projects/olympia/backend/seed_question_pipeline.py

import os
import pandas as pd
import glob
from sqlmodel import Session
from datetime import datetime, timezone

from database import engine, create_db_and_tables
from models import Question

def read_csv_files(directory_path):
    """Read all CSV files in the specified directory and return a combined DataFrame."""
    # Get a list of all CSV files in the directory
    csv_files = glob.glob(os.path.join(directory_path, "*.csv"))
    
    if not csv_files:
        print(f"No CSV files found in {directory_path}")
        return None
    
    combined_df = pd.DataFrame()
    
    # Read each CSV file and concatenate them
    for file in csv_files:
        try:
            print(f"Reading file: {file}")
            # Make sure to read strings as strings, not as numeric values
            df = pd.read_csv(file, dtype={'question': str, 'answer': str})
            
            # Check if the required columns exist
            if 'question' in df.columns and 'answer' in df.columns:
                # Make sure all values are strings
                df['question'] = df['question'].astype(str)
                df['answer'] = df['answer'].astype(str)
                
                # Replace NaN values with empty strings
                df = df.fillna('')
                
                combined_df = pd.concat([combined_df, df], ignore_index=True)
            else:
                print(f"File {file} doesn't have required columns (question, answer). Skipping...")
        except Exception as e:
            print(f"Error reading file {file}: {e}")
    
    return combined_df

def seed_questions(df):
    """Seed the questions from the DataFrame into the database."""
    if df is None or df.empty:
        print("No data to seed.")
        return
    
    # Create a Session
    with Session(engine) as session:
        # Check for duplicates in the database
        from sqlmodel import select
        query = select(Question)
        existing_questions = {q.question: q for q in session.exec(query).all()}
        
        # Count metrics
        added_count = 0
        skipped_count = 0
        
        # Add each question to the database
        for _, row in df.iterrows():
            question_text = row['question']
            answer_text = row['answer']
            
            # Skip if the question already exists in the database
            if question_text in existing_questions:
                skipped_count += 1
                continue
            
            # Create a new Question object
            new_question = Question(
                question=question_text,
                answer=answer_text,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            # Add the question to the session
            session.add(new_question)
            added_count += 1
        
        # Commit the changes to the database
        try:
            session.commit()
            print(f"Successfully added {added_count} questions to the database.")
            print(f"Skipped {skipped_count} questions that already existed.")
        except Exception as e:
            session.rollback()
            print(f"Error committing to database: {e}")

def main():
    """Main function to run the seed pipeline."""
    # Ensure database and tables exist
    create_db_and_tables()
    
    # Define the data directory path
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    
    # Read the CSV files
    df = read_csv_files(data_dir)
    
    # Seed the questions
    seed_questions(df)
    
    print("Seeding process completed!")

if __name__ == "__main__":
    main()