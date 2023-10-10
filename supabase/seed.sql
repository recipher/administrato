insert into localities (name, "isoCode")
values 
  ('United Kingdom', 'GB'), 
  ('Germany', 'DE'),
  ('Spain', 'ES'), 
  ('France', 'FR');

insert into "milestoneSets" (id, identifier, "isDefault") 
values 
  ('01HCBKHC7Z70JR4KB454HJP1Y3', 'default', TRUE),
  ('01HCBKHNQX9D061VY631505CJZ', 'extra', FALSE),
  ('01HCBXYRXCQ9SRWR9K3KMW1NGX', 'special', FALSE);

insert into milestones (id, identifier, description, index, interval, target, entities, "setId")
values
  ('01HCBKQW7HGMS673JYV0YEGDKH', 'first', 'First', 0, null, FALSE, ARRAY ['provider','service-centre'], '01HCBKHC7Z70JR4KB454HJP1Y3'),
  ('01HCBM2T851SVXW3VN8P7FGM2', 'second', 'Second', 1, 1, FALSE, ARRAY ['provider','service-centre', 'client'], '01HCBKHC7Z70JR4KB454HJP1Y3'),
  ('01HCBM2T85X6J8V60MK67VCPW1', 'third', 'Third', 2, 0, FALSE, ARRAY ['provider','client'], '01HCBKHC7Z70JR4KB454HJP1Y3'),
  ('01HCBM3XZABZX1ZMFMSNW3453N', 'fourth', 'Fourth', 3, 3, FALSE, ARRAY ['service-centre'], '01HCBKHC7Z70JR4KB454HJP1Y3'),
  ('01HCBM3XZBKKBE5H7W5JWBDRJ6', 'target', 'Target', 4, 2, TRUE, ARRAY ['legal-entity'], '01HCBKHC7Z70JR4KB454HJP1Y3'),
  ('01HCBM3XZBCGNVBC2XYX0XPVJB', 'one', 'One', 0, 0, FALSE, ARRAY ['provider'], '01HCBKHNQX9D061VY631505CJZ'),
  ('01HCBM3XZBVYB5M1SK9Y78PHA8', 'two', 'Two', 1, 1, FALSE, ARRAY ['provider','service-centre'], '01HCBKHNQX9D061VY631505CJZ'),
  ('01HCBM3XZBNSFTQF2YSNCJPKA7', 'three', 'Three', 2, 1, FALSE, ARRAY ['service-centre'], '01HCBKHNQX9D061VY631505CJZ'),
  ('01HCBM3XZB378W56ZRPA0P66Q1', 'target', 'Target', 3, 2, TRUE, ARRAY ['legal-entity'], '01HCBKHNQX9D061VY631505CJZ'),
  ('01HCBXQ1T8E9YSS4RS4NKK5H2V', 'alpha', 'Alpha', 0, null, FALSE, ARRAY ['provider'], '01HCBXYRXCQ9SRWR9K3KMW1NGX'),
  ('01HCBXQ1T80N9C65GZAAXFHT0H', 'beta', 'Beta', 1, 3, FALSE, ARRAY ['provider','service-centre'], '01HCBXYRXCQ9SRWR9K3KMW1NGX'),
  ('01HCBXQ1T88SZJKFXNECJM8S03', 'gamma', 'Gamma', 2, 1, FALSE, ARRAY ['client', 'service-centre'], '01HCBXYRXCQ9SRWR9K3KMW1NGX'),
  ('01HCBXQ1T8ZKN2CH2H58T1Y81H', 'target', 'Target', 3, 2, TRUE, ARRAY ['client', 'legal-entity'], '01HCBXYRXCQ9SRWR9K3KMW1NGX'),
  ('01HCBXQ1T8E4RVFXR7BDCF5QAD', 'epsilon', 'Epsilon', 4, 3, FALSE, ARRAY ['service-centre'], '01HCBXYRXCQ9SRWR9K3KMW1NGX'),
  ('01HCBXQ1T8SRYNY3KRCSVMCJM4', 'zeta', 'Zeta', 5, 1, FALSE, ARRAY ['service-centre'], '01HCBXYRXCQ9SRWR9K3KMW1NGX');

insert into "serviceCentres" (id, name, identifier, "keyStart", "keyEnd", localities)
values
  ('01HCBJVVNC04DA94ZYXEEXX75C', 'Scotland', 'scotland', 0, 90071992547410, ARRAY ['GB']),
  ('01HCBJWYAGFTDT8E8RZ3SVSB5A', 'Spain', 'spain', 90071992547411, 180143985094821, ARRAY ['ES'] );

insert into providers (id, name, identifier, "keyStart", "keyEnd", localities, "serviceCentreId")
values
  ('01HCBK0NA4QEK673M0BYEB5STQ', 'Processor', 'processor', 0, 9007199255, ARRAY ['GB'], '01HCBJVVNC04DA94ZYXEEXX75C'),
  ('01HCBK188VQ1XJVKPVE7A2NKFZ', 'Factory', 'factory', 90071992547411, 90090006945920, ARRAY ['FR'], '01HCBJWYAGFTDT8E8RZ3SVSB5A');

insert into "legalEntities" (id, name, identifier, frequency, target, "keyStart", "keyEnd", localities, "providerId", "serviceCentreId", "milestoneSetId")
values
  ('01HCBK65Q9M5JPZNYGP9BRN2SV', 'Recipher One', 'recipher-one', 'monthly', 'last 0', 0, 9007199255, ARRAY ['DE'], '01HCBK188VQ1XJVKPVE7A2NKFZ', '01HCBJVVNC04DA94ZYXEEXX75C', '01HCBXYRXCQ9SRWR9K3KMW1NGX'),
  ('01HCBK71C77MHV3ZG2K8CHMDAA', 'Recipher Two', 'recipher-two', 'weekly', 'date friday', 90071992547411, 90090006945920, ARRAY ['ES'], '01HCBK0NA4QEK673M0BYEB5STQ', '01HCBJWYAGFTDT8E8RZ3SVSB5A', null);

insert into clients (id, name, identifier, "keyStart", "keyEnd", localities, "serviceCentreId")
values
  ('01HCBKBH3V6QXD01YNRG6X684K', 'Widget Inc', 'widget-inc', 0, 90071993, ARRAY ['FR'], '01HCBJVVNC04DA94ZYXEEXX75C'),
  ('01HCBKC9524YW5395EY1FB53QT', 'Foobar LLC', 'foobar-llc', 90071992547411, 90072172691396, ARRAY['GB'], '01HCBJWYAGFTDT8E8RZ3SVSB5A');
