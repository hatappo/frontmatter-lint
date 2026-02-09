export interface BlogPost {
  title: string;
  date: string;
  author?: string;
  tags?: string[];
  draft?: boolean;
}

export interface Product {
  name: string;
  price: number;
  category: "electronics" | "clothing" | "books";
  inStock: boolean;
}

export type Status = "draft" | "published" | "archived";

export interface Article {
  title: string;
  status: Status;
  metadata?: {
    views: number;
    likes: number;
  };
}
