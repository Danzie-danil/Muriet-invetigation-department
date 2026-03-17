-- Refine RB Number generation to allow manual override and provide RPC for frontend pre-fill
CREATE OR REPLACE FUNCTION generate_muriet_rb_number()
RETURNS TRIGGER AS $$
DECLARE
    current_year INTEGER;
    next_sequence_number INTEGER;
    formatted_sequence TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW());
    
    -- ONLY generate if rb_number is null or empty
    IF NEW.rb_number IS NULL OR NEW.rb_number = '' THEN
        SELECT COALESCE(MAX(CAST(substring(rb_number FROM '/RB/([0-9]+)/') AS INTEGER)), 0) + 1
        INTO next_sequence_number
        FROM cases
        WHERE year = current_year;

        formatted_sequence := LPAD(next_sequence_number::TEXT, 4, '0');
        NEW.rb_number := 'MURIET/RB/' || formatted_sequence || '/' || current_year::TEXT;
    END IF;

    IF NEW.year IS NULL THEN
        NEW.year := current_year;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RPC Function for frontend to get the next RB number
CREATE OR REPLACE FUNCTION get_next_rb_number()
RETURNS TEXT AS $$
DECLARE
    current_year INTEGER;
    next_sequence_number INTEGER;
    formatted_sequence TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW());
    
    SELECT COALESCE(MAX(CAST(substring(rb_number FROM '/RB/([0-9]+)/') AS INTEGER)), 0) + 1
    INTO next_sequence_number
    FROM cases
    WHERE year = current_year;

    formatted_sequence := LPAD(next_sequence_number::TEXT, 4, '0');
    RETURN 'MURIET/RB/' || formatted_sequence || '/' || current_year::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
