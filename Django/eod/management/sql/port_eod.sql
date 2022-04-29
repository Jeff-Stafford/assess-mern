INSERT INTO public.states
  (id, name, abbr, fips_code)
  SELECT eods.id, eods.name, eods.abbr, eods.fips_code
    FROM election_manager_eod.states eods
   WHERE NOT EXISTS (SELECT 1
                       FROM public.states ps
                      WHERE ps.id = eods.id
                        AND ps.abbr = eods.abbr);

SELECT setval(pg_get_serial_sequence('public.states', 'id'), COALESCE(MAX(id),0) + 1, false) FROM public.states;


INSERT INTO public.counties
  (id, name, county_type, state_id)
  SELECT eodc.id, eodc.name, eodc.county_type, eodc.state_id
    FROM election_manager_eod.counties eodc;

SELECT setval(pg_get_serial_sequence('public.counties', 'id'), COALESCE(MAX(id),0) + 1, false) FROM public.counties;


INSERT INTO public.municipalities
  (id, name, municipality_type, county_id, state_id)
  SELECT eodm.id, eodm.name, eodm.municipality_type, eodm.county_id, eodm.state_id
  FROM election_manager_eod.municipalities eodm;

SELECT setval(pg_get_serial_sequence('public.municipalities', 'id'), COALESCE(MAX(id),0) + 1, false) FROM public.municipalities;


INSERT INTO public.voting_regions
  (id, name, county_id, municipality_id, state_id)
  SELECT eodvr.id, eodvr.name, eodvr.county_id, eodvr.municipality_id, eodvr.state_id
    FROM election_manager_eod.voting_regions eodvr;

SELECT setval(pg_get_serial_sequence('public.voting_regions', 'id'), COALESCE(MAX(id),0) + 1, false) FROM public.voting_regions;



INSERT INTO public.local_officials
  (id, updated, general_email, website, hours, further_instruction, status, region_id)
  SELECT eodlo.id, eodlo.updated, eodlo.general_email, eodlo.website, eodlo.hours, eodlo.further_instruction, eodlo.status, eodlo.region_id
    FROM election_manager_eod.local_officials eodlo;

SELECT setval(pg_get_serial_sequence('public.local_officials', 'id'), COALESCE(MAX(id),0) + 1, false) FROM public.local_officials;


INSERT INTO public.addresses
  (id, order_number, address_to, street1, street2, city, state, zip, zip4, website, is_physical, is_regular_mail, functions)
  SELECT eoda.id, 0, eoda.address_to, eoda.street1, eoda.street2, eoda.city, eoda.state, eoda.zip, eoda.zip4, '', false, false, '{}'
    FROM election_manager_eod.addresses eoda;

SELECT setval(pg_get_serial_sequence('public.addresses', 'id'), COALESCE(MAX(id),0) + 1, false) FROM public.addresses;


INSERT INTO public.officers
  (id, order_number, office_name, title, first_name, initial, last_name, suffix, phone, fax, email)
  SELECT eodo.id,
         eodo.order_number,
         eodo.office_name,
         eodo.title,
         eodo.first_name,
         eodo.initial,
         eodo.last_name,
         eodo.suffix,
         eodo.phone,
         eodo.fax,
         eodo.email
    FROM election_manager_eod.officers eodo;

SELECT setval(pg_get_serial_sequence('public.officers', 'id'), COALESCE(MAX(id),0) + 1, false) FROM public.officers;



UPDATE public.addresses
   SET order_number = 1,
       local_official_id = eodlo.id,
       is_physical = true,
       functions = '{DOM_VR, DOM_REQ, DOM_RET, OVS_REQ, OVS_RET}'
  FROM election_manager_eod.local_officials eodlo
 WHERE eodlo.physical_address_id = public.addresses.id;

UPDATE public.addresses
   SET order_number = 2,
       local_official_id = eodlo.id,
       is_regular_mail = true,
       functions = '{DOM_VR, DOM_REQ, DOM_RET, OVS_REQ, OVS_RET}'
  FROM election_manager_eod.local_officials eodlo
 WHERE eodlo.mailing_address_id = public.addresses.id;

UPDATE public.addresses
   SET order_number = 3 + eodaa.ordering,
       website = CASE
          WHEN eodaa.website IS NULL THEN ''
          ELSE eodaa.website
       END,
       local_official_id = eodaa.local_official_id
  FROM election_manager_eod.eod_additional_address eodaa
 WHERE eodaa.address_id = public.addresses.id;

UPDATE public.officers
   SET local_official_id = eodloto.local_official_id
  FROM election_manager_eod.local_officials_to_officers eodloto
 WHERE eodloto.officer_id = public.officers.id;

UPDATE public.addresses
   SET primary_contact_id = po.id
  FROM public.officers po
 WHERE po.local_official_id = public.addresses.local_official_id
   AND po.order_number = 1;

INSERT INTO public.address_officer
   (address_id, officer_id)
  SELECT pa.id, pa.primary_contact_id
    FROM public.addresses pa
   WHERE pa.primary_contact_id IS NOT NULL;