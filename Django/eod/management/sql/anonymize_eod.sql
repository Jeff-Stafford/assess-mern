UPDATE officers
   SET email = 'ovf-anonymized@test.com'
 WHERE email IS NOT NULL
    AND email != '';

UPDATE addresses
   SET main_email = 'ovf-anonymized@test.com'
 WHERE main_email IS NOT NULL
    AND main_email != '';

