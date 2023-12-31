export enum Classifier {
  Worker = "worker",
  Employee = "employee",
  Contractor = "contractor",
  Person = "person",
  Dependent = "dependent",
};

export enum ContactClassifier {
  Phone = "phone",
  Email = "email",
  Social = "social",
  Web = "web",
};

export const Subs = {
  [ContactClassifier.Phone]: [ "personal", "work", "other" ],
  [ContactClassifier.Email]: [ "personal", "work", "other" ],
  [ContactClassifier.Social]: [ "twitter", "facebook", "whatsapp", "snapchat", "linkedin", "instagram" ],
  [ContactClassifier.Web]: [],
};

export const BankAccountClassifiers = [ 'personal', 'business' ];

export const AddressClassifiers = [ 'personal', 'business' ];
export const AddressFields = [
  'address1',
  'address2',
  'addressNum',
  'city',
  'country',
  'countryIsoCode',
  'postalCode',
  'region',
  'state',
  'province',
  'prefecture',
  'republic',
  'do',
  'dong',
  'gu',
  'si',
  'companyName',
];
export const NameFields = [ 
  'firstName', 
  'secondName', 
  'firstLastName', 
  'secondLastName', 
  'lastName', 
  'honorific' 
];
export const Honorifics = [ "Mr", "Mrs", "Ms", "Miss", "Dr" ];

export const Relationships = [ 
  "partner",
  "father",
  "mother",
  "son",
  "daughter",
  "sibling",
];
