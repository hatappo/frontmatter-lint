import { describe, it, expect } from "vitest";
import { parseYaml } from "../../src/parser/yaml.js";

describe("parseYaml", () => {
  it("should parse simple key-value pairs", () => {
    const input = `
title: Hello World
count: 42
enabled: true
`;
    const result = parseYaml(input);
    expect(result).toEqual({
      title: "Hello World",
      count: 42,
      enabled: true,
    });
  });

  it("should parse quoted strings", () => {
    const input = `
single: 'Hello'
double: "World"
`;
    const result = parseYaml(input);
    expect(result).toEqual({
      single: "Hello",
      double: "World",
    });
  });

  it("should parse arrays", () => {
    const input = `
tags:
  - tech
  - programming
  - typescript
`;
    const result = parseYaml(input);
    expect(result).toEqual({
      tags: ["tech", "programming", "typescript"],
    });
  });

  it("should parse nested objects", () => {
    const input = `
author:
  name: John
  email: john@example.com
`;
    const result = parseYaml(input);
    expect(result).toEqual({
      author: {
        name: "John",
        email: "john@example.com",
      },
    });
  });

  it("should parse null values", () => {
    const input = `
empty: null
tilde: ~
blank:
`;
    const result = parseYaml(input);
    expect(result).toEqual({
      empty: null,
      tilde: null,
      blank: null,
    });
  });

  it("should parse boolean values", () => {
    const input = `
yes: true
no: false
YES: TRUE
NO: FALSE
`;
    const result = parseYaml(input);
    expect(result).toEqual({
      yes: true,
      no: false,
      YES: true,
      NO: false,
    });
  });

  it("should parse numbers", () => {
    const input = `
integer: 42
negative: -10
float: 3.14
`;
    const result = parseYaml(input);
    expect(result).toEqual({
      integer: 42,
      negative: -10,
      float: 3.14,
    });
  });

  it("should preserve date strings", () => {
    const input = `
date: 2024-01-01
datetime: 2024-01-01T12:00:00Z
`;
    const result = parseYaml(input);
    expect(result).toEqual({
      date: "2024-01-01",
      datetime: "2024-01-01T12:00:00Z",
    });
  });

  it("should ignore comments", () => {
    const input = `
# This is a comment
title: Hello
# Another comment
count: 42
`;
    const result = parseYaml(input);
    expect(result).toEqual({
      title: "Hello",
      count: 42,
    });
  });

  it("should parse arrays of objects", () => {
    const input = `
authors:
  - name: John
    role: admin
  - name: Jane
    role: editor
`;
    const result = parseYaml(input);
    expect(result).toEqual({
      authors: [
        { name: "John", role: "admin" },
        { name: "Jane", role: "editor" },
      ],
    });
  });
});
