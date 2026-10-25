import { describe, expect, test } from "bun:test";
import {
  CapabilityRef,
  RelationType,
  relationTargetKey,
} from "../src/relation";

describe("RelationType.make", () => {
  test("defaults acyclic and grantsInvocation to false and returns a frozen RelationType", () => {
    const type = RelationType.make("a.b", {
      description: "d",
      target: "locus",
    });
    expect(type._tag).toBe("RelationType");
    expect(type.acyclic).toBe(false);
    expect(type.grantsInvocation).toBe(false);
    expect(Object.isFrozen(type)).toBe(true);
  });
});

describe("RelationType.to", () => {
  const type = RelationType.make("a.b", {
    description: "d",
    target: "capability",
  });

  test("a { id } object gives a locus target with a null capability", () => {
    expect(type.to({ id: "x:y" }).target).toEqual({
      locus: "x:y",
      capability: null,
    });
  });

  test("a CapabilityRef gives a target with its locus and capability", () => {
    expect(type.to(CapabilityRef.make("x:y", "add")).target).toEqual({
      locus: "x:y",
      capability: "add",
    });
  });

  test("a string with a hash is parsed as a capability key", () => {
    expect(type.to("x:y#add").target).toEqual({
      locus: "x:y",
      capability: "add",
    });
  });

  test("a string without a hash is a locus with a null capability", () => {
    expect(type.to("x:y").target).toEqual({ locus: "x:y", capability: null });
  });

  test("the relation and its target are frozen, and relation.type is the same object as the type", () => {
    const relation = type.to({ id: "x:y" });
    expect(Object.isFrozen(relation)).toBe(true);
    expect(Object.isFrozen(relation.target)).toBe(true);
    expect(relation.type).toBe(type);
  });
});

describe("relationTargetKey", () => {
  test("a target without capability is the locus id", () => {
    expect(relationTargetKey({ locus: "x:y", capability: null })).toBe("x:y");
  });

  test("a target with a capability is the capability key", () => {
    expect(relationTargetKey({ locus: "x:y", capability: "add" })).toBe(
      "x:y#add",
    );
  });
});
