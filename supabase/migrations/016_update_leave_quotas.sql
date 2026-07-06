-- Migration 016: Update default leave quotas
-- Annual: 20→5, Sick: 10→5, Casual: 5→3
-- Per audit report item #1

-- Update the trigger so all NEW employees get the new defaults
CREATE OR REPLACE FUNCTION create_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO leave_balances (employee_id, annual_quota, sick_quota, casual_quota)
  VALUES (NEW.id, 5, 5, 3);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update EXISTING employees who still have the old default values
UPDATE leave_balances
SET    annual_quota = 5,
       sick_quota   = 5,
       casual_quota = 3,
       updated_at   = NOW()
WHERE  annual_quota = 20
  AND  sick_quota   = 10
  AND  casual_quota = 5;
