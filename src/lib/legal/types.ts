/** One numbered section of a legal page. */
export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  items?: { term: string; detail: string }[];
  list?: string[];
}

export interface LegalDocument {
  title: string;
  /** The highlighted last word of the title. */
  highlight: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}
