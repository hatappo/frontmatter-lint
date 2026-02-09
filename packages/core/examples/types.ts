export interface BlogPost {
  title: string;
  date: string;
  author?: string;
  tags?: string[];
  draft?: boolean;
}

export type BlogPost2 = {
  title: string;
  date: string;
  author?: string;
  tags?: string[];
  draft?: boolean;
}
