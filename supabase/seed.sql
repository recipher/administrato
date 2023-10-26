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
  ('01HCBKQW7HGMS673JYV0YEGDKH', 'first', 'First', 0, null, FALSE, ARRAY ['provider','security-group'], '01HCBKHC7Z70JR4KB454HJP1Y3'),
  ('01HCBM2T851SVXW3VN8P7FGM2', 'second', 'Second', 1, 1, FALSE, ARRAY ['provider','security-group', 'client'], '01HCBKHC7Z70JR4KB454HJP1Y3'),
  ('01HCBM2T85X6J8V60MK67VCPW1', 'third', 'Third', 2, 0, FALSE, ARRAY ['provider','client'], '01HCBKHC7Z70JR4KB454HJP1Y3'),
  ('01HCBM3XZABZX1ZMFMSNW3453N', 'fourth', 'Fourth', 3, 3, FALSE, ARRAY ['security-group'], '01HCBKHC7Z70JR4KB454HJP1Y3'),
  ('01HCBM3XZBKKBE5H7W5JWBDRJ6', 'target', 'Target', 4, 2, TRUE, ARRAY ['legal-entity'], '01HCBKHC7Z70JR4KB454HJP1Y3'),
  ('01HCBM3XZBCGNVBC2XYX0XPVJB', 'one', 'One', 0, 0, FALSE, ARRAY ['provider'], '01HCBKHNQX9D061VY631505CJZ'),
  ('01HCBM3XZBVYB5M1SK9Y78PHA8', 'two', 'Two', 1, 1, FALSE, ARRAY ['provider','security-group'], '01HCBKHNQX9D061VY631505CJZ'),
  ('01HCBM3XZBNSFTQF2YSNCJPKA7', 'three', 'Three', 2, 1, FALSE, ARRAY ['security-group'], '01HCBKHNQX9D061VY631505CJZ'),
  ('01HCBM3XZB378W56ZRPA0P66Q1', 'target', 'Target', 3, 2, TRUE, ARRAY ['legal-entity'], '01HCBKHNQX9D061VY631505CJZ'),
  ('01HCBXQ1T8E9YSS4RS4NKK5H2V', 'alpha', 'Alpha', 0, null, FALSE, ARRAY ['provider'], '01HCBXYRXCQ9SRWR9K3KMW1NGX'),
  ('01HCBXQ1T80N9C65GZAAXFHT0H', 'beta', 'Beta', 1, 3, FALSE, ARRAY ['provider','security-group'], '01HCBXYRXCQ9SRWR9K3KMW1NGX'),
  ('01HCBXQ1T88SZJKFXNECJM8S03', 'gamma', 'Gamma', 2, 1, FALSE, ARRAY ['client', 'security-group'], '01HCBXYRXCQ9SRWR9K3KMW1NGX'),
  ('01HCBXQ1T8ZKN2CH2H58T1Y81H', 'target', 'Target', 3, 2, TRUE, ARRAY ['client', 'legal-entity'], '01HCBXYRXCQ9SRWR9K3KMW1NGX'),
  ('01HCBXQ1T8E4RVFXR7BDCF5QAD', 'epsilon', 'Epsilon', 4, 3, FALSE, ARRAY ['security-group'], '01HCBXYRXCQ9SRWR9K3KMW1NGX'),
  ('01HCBXQ1T8SRYNY3KRCSVMCJM4', 'zeta', 'Zeta', 5, 1, FALSE, ARRAY ['security-group'], '01HCBXYRXCQ9SRWR9K3KMW1NGX');

insert into "securityGroups" (id, name, identifier, "keyStart", "keyEnd", localities)
values
  ('01HCBJVVNC04DA94ZYXEEXX75C', 'Scotland', 'scotland', 0, 90071992547410, ARRAY ['GB']),
  ('01HCBJWYAGFTDT8E8RZ3SVSB5A', 'Spain', 'spain', 90071992547411, 180143985094821, ARRAY ['ES'] );

insert into providers (id, name, identifier, "keyStart", "keyEnd", localities, "securityGroupId")
values
  ('01HCBK0NA4QEK673M0BYEB5STQ', 'Processor', 'processor', 0, 9007199255, ARRAY ['GB'], '01HCBJVVNC04DA94ZYXEEXX75C'),
  ('01HCBK188VQ1XJVKPVE7A2NKFZ', 'Factory', 'factory', 90071992547411, 90090006945920, ARRAY ['FR'], '01HCBJWYAGFTDT8E8RZ3SVSB5A');

insert into "legalEntities" (id, name, identifier, frequency, target, "keyStart", "keyEnd", localities, "providerId", "securityGroupId", "milestoneSetId")
values
  ('01HCBK65Q9M5JPZNYGP9BRN2SV', 'Recipher One', 'recipher-one', 'monthly', 'last 0', 0, 9007199255, ARRAY ['DE'], '01HCBK188VQ1XJVKPVE7A2NKFZ', '01HCBJVVNC04DA94ZYXEEXX75C', '01HCBXYRXCQ9SRWR9K3KMW1NGX'),
  ('01HCBK71C77MHV3ZG2K8CHMDAA', 'Recipher Two', 'recipher-two', 'weekly', 'day friday', 90071992547411, 90090006945920, ARRAY ['ES'], '01HCBK0NA4QEK673M0BYEB5STQ', '01HCBJWYAGFTDT8E8RZ3SVSB5A', null),
  ('01HCM8VP0S823GTVGTK275A9XZ', 'Recipher Three', 'recipher-three', 'semi-monthly', 'date 15,last 0', 90090006945921, 90108021344430, ARRAY ['DE'], '01HCBK0NA4QEK673M0BYEB5STQ', '01HCBJWYAGFTDT8E8RZ3SVSB5A', '01HCBKHNQX9D061VY631505CJZ');

insert into clients (id, name, identifier, "keyStart", "keyEnd", localities, "securityGroupId")
values
  ('01HCBKBH3V6QXD01YNRG6X684K', 'Widget Inc', 'widget-inc', 0, 90071993, ARRAY ['FR'], '01HCBJVVNC04DA94ZYXEEXX75C'),
  ('01HCBKC9524YW5395EY1FB53QT', 'Foobar LLC', 'foobar-llc', 90071992547411, 90072172691396, ARRAY['GB'], '01HCBJWYAGFTDT8E8RZ3SVSB5A');

insert into people (id, identifier, "firstName", "lastName", "honorific", classifier, "clientKeyStart", "clientKeyEnd", "legalEntityKeyStart", "legalEntityKeyEnd", "locality", "nationality")
values
  ('01HCHFEYGT9SKDSPQWQKPXJN2S', 'john-doe', 'John', 'Doe', 'Mr', 'worker', 90071992547411, 90072172691396, 90071992547411, 90090006945920, 'GB', 'GB'),
  ('01HCHFN24FTVCJMATWBTHYQRN8', 'jane-doe', 'Jane', 'Doe', 'Ms', 'worker', 0, 90072172691396, 0, 9007199255, 'FR', 'FR');

insert into "clientPeople" (id, "clientId", "personId", "startOn")
values
  ('01HCHFN24GKH2NSYWG60PC5T6Z', '01HCBKC9524YW5395EY1FB53QT', '01HCHFEYGT9SKDSPQWQKPXJN2S', '2023-10-01'),
  ('01HCHFTC5JKP1Q26JWZ6FDCDQJ', '01HCBKBH3V6QXD01YNRG6X684K', '01HCHFN24FTVCJMATWBTHYQRN8', '2023-10-01');

insert into "legalEntityPeople" (id, "legalEntityId", "personId", "startOn")
values
  ('01HCHFN24G9KFWYZSY6QX9AX5C', '01HCBK71C77MHV3ZG2K8CHMDAA', '01HCHFEYGT9SKDSPQWQKPXJN2S', '2023-10-01'),
  ('01HCHFTC5JG3BAA466YECZNGCE', '01HCBK65Q9M5JPZNYGP9BRN2SV', '01HCHFN24FTVCJMATWBTHYQRN8', '2023-10-01');

insert into "authorizations" (id, "user", "keyStart", "keyEnd", organization, entity)
values  
  ('01HDP3T7V7TDKEG3E0AEFZX013', 'auth0|631a1c1bc11a9a4be93f23bb', 0, 9007199254740991, 'default', 'security-group'),
  ('01HDP3T7V8F2EKYRV59NY3D4VZ', 'auth0|631a40f90f8e1eedb754d102', 0, 9007199254740991, 'default', 'security-group');
  