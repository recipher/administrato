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