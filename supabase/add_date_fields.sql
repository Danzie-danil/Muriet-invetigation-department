-- Add date_of_crime and date_of_reporting columns to cases table
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS date_of_crime DATE,
ADD COLUMN IF NOT EXISTS date_of_reporting DATE DEFAULT CURRENT_DATE;

-- Comment on columns for clarity
COMMENT ON COLUMN cases.date_of_crime IS 'The actual date when the crime/incident occurred';
COMMENT ON COLUMN cases.date_of_reporting IS 'The date when the case was officially reported to the station';
