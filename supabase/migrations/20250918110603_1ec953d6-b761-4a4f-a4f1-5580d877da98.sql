-- Add category field to modules table
ALTER TABLE public.modules 
ADD COLUMN category text NOT NULL DEFAULT 'Heat Transfer';

-- Update existing modules to belong to Heat Transfer category
UPDATE public.modules 
SET category = 'Heat Transfer' 
WHERE category = 'Heat Transfer';

-- Add check constraint for valid categories
ALTER TABLE public.modules 
ADD CONSTRAINT valid_category 
CHECK (category IN ('Momentum Transfer', 'Heat Transfer', 'Mass Transfer'));