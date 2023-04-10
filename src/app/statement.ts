export interface Ranking {
  [sid: string]: string[][];
}

export interface Statement {
  parent: string;
  kids: string[];
  owner: string;
  text: string;
  ranking_kids: Ranking;
  counter: number;
}

export interface Collection {
  [sid: string]: Statement;
}

export interface Page {
  parent: Collection;
  kids: Collection;
}
