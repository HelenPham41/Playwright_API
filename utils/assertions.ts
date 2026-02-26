import { expect } from "@playwright/test";

export function expectStatus(
 status:number,
 allowed:number[]
){
 expect(allowed).toContain(status);
}