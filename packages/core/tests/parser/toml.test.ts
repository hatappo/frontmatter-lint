import { describe, it, expect } from "vitest";
import { parseToml } from "../../src/parser/toml.js";

describe("parseToml", () => {
  it("should parse simple key-value pairs", () => {
    const input = `
title = "Hello World"
count = 42
enabled = true
`;
    const result = parseToml(input);
    expect(result).toEqual({
      title: "Hello World",
      count: 42,
      enabled: true,
    });
  });

  it("should parse quoted strings", () => {
    const input = `
double = "Hello"
single = 'World'
`;
    const result = parseToml(input);
    expect(result).toEqual({
      double: "Hello",
      single: "World",
    });
  });

  it("should parse arrays", () => {
    const input = `
tags = ["tech", "programming", "typescript"]
numbers = [1, 2, 3]
`;
    const result = parseToml(input);
    expect(result).toEqual({
      tags: ["tech", "programming", "typescript"],
      numbers: [1, 2, 3],
    });
  });

  it("should parse tables", () => {
    const input = `
[author]
name = "John"
email = "john@example.com"
`;
    const result = parseToml(input);
    expect(result).toEqual({
      author: {
        name: "John",
        email: "john@example.com",
      },
    });
  });

  it("should parse nested tables", () => {
    const input = `
[database.connection]
host = "localhost"
port = 5432
`;
    const result = parseToml(input);
    expect(result).toEqual({
      database: {
        connection: {
          host: "localhost",
          port: 5432,
        },
      },
    });
  });

  it("should parse inline tables", () => {
    const input = `
point = { x = 1, y = 2 }
`;
    const result = parseToml(input);
    expect(result).toEqual({
      point: { x: 1, y: 2 },
    });
  });

  it("should parse boolean values", () => {
    const input = `
yes = true
no = false
`;
    const result = parseToml(input);
    expect(result).toEqual({
      yes: true,
      no: false,
    });
  });

  it("should parse numbers", () => {
    const input = `
integer = 42
negative = -10
float = 3.14
`;
    const result = parseToml(input);
    expect(result).toEqual({
      integer: 42,
      negative: -10,
      float: 3.14,
    });
  });

  it("should preserve date strings", () => {
    const input = `
date = 2024-01-01
datetime = 2024-01-01T12:00:00Z
`;
    const result = parseToml(input);
    expect(result).toEqual({
      date: "2024-01-01",
      datetime: "2024-01-01T12:00:00Z",
    });
  });

  it("should ignore comments", () => {
    const input = `
# This is a comment
title = "Hello"
# Another comment
count = 42
`;
    const result = parseToml(input);
    expect(result).toEqual({
      title: "Hello",
      count: 42,
    });
  });

  it("should handle escape sequences in strings", () => {
    const input = `
text = "Hello\\nWorld"
path = "C:\\\\Users"
`;
    const result = parseToml(input);
    expect(result).toEqual({
      text: "Hello\nWorld",
      path: "C:\\Users",
    });
  });

  it("should parse mixed content", () => {
    const input = `
title = "My Blog Post"
tags = ["tech", "programming"]
draft = false

[author]
name = "John"
`;
    const result = parseToml(input);
    expect(result).toEqual({
      title: "My Blog Post",
      tags: ["tech", "programming"],
      draft: false,
      author: {
        name: "John",
      },
    });
  });
});
