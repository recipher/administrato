export type BankingConfig = {
  country: string;
  otherCountries: Array<string>;
  bban: {
    structure: string;
    length: number;
    bankPosition?: [ number, number ];
    bankIdentifier?: string;
    branchPosition?: [ number, number ];
    branchIdentifier?: string;
  };
  iban: {
    structure: string;
    length: number;
    checkDigits: string;
  };
};

export const banking = [
  { country: "DE",
    bban: {
      structure: "8!n10!n",
      length: 18,
      bankPosition: [ 1, 8 ],
      bankIdentifier: "8!n",
    },
    iban: {
      structure: "DE2!n8!n10!n",
      length: 22,
      checkDigits: "89",
    },
  },   
  { country: "ES",
    bban: {
      structure: "4!n4!n1!n1!n10!n",
      length: 20,
      bankPosition: [ 1, 4 ],
      bankIdentifier: "4!n",
      branchPosition: [ 5, 8 ],
      branchIdentifier: "4!n",
    },
    iban: {
      structure: "ES2!n4!n4!n1!n1!n10!n",
      length: 24,
      checkDigits: "91",
    },
  },  
  { country: "FR",
    otherCountries: [ "GF", "GP", "MQ", "RE", "PF", "TF", "YT", "NC", "BL", "MF", "PM", "WF" ],
    bban: {
      structure: "5!n5!n11!c2!n",
      length: 23,
      bankPosition: [ 1, 5 ],
      bankIdentifier: "5!n",
    },
    iban: {
      structure: "FR2!n5!n5!n11!c2!n",
      length: 27,
      checkDigits: "14",
    },
  },
  { country: "GB",
    otherCountries: [ "JE", "IM", "GG" ],
    bban: {
      structure: "4!a6!n8!n",
      length: 18,
      bankPosition: [ 1, 4 ],
      bankIdentifier: "4!a",
      branchPosition: [ 5, 10 ],
      branchIdentifier: "6!n",

    },
    iban: {
      structure: "GB2!n4!a6!n8!n",
      length: 22,
      checkDigits: "29",
    },
  },
] as Array<BankingConfig>;

export const getBankingConfig = (isoCode: string): BankingConfig | undefined =>
  banking.find(b => b.country === isoCode);