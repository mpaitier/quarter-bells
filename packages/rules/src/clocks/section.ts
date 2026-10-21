import Type from "typebox";
import { SECTION_COUNT } from "./clock.js";

/** Index d'une section, de 0 à SECTION_COUNT - 1. */
export const SectionIndex = Type.Integer({
  minimum: 0,
  maximum: SECTION_COUNT - 1,
});
