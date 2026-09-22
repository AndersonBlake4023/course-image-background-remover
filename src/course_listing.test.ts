import assert from "node:assert/strict";
import { test } from "node:test";
import { chooseListingState } from "./course_listing.ts";

test("a processed image can move a course listing to ready", () => {
  assert.equal(chooseListingState({ image: "https://cdn.example/clean.png" }), "ready");
});

test("an empty processed image remains for review", () => {
  assert.equal(chooseListingState({ image: "" }), "needs-review");
});
