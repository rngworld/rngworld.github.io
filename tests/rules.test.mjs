// Firestore rules tests, run by GitHub Actions in the Firestore emulator (.github/workflows/rules-test.yml).
// Each check prints "ok" or a GitHub "::error::" line; the run fails if any check fails.
import fs from "node:fs";
import crypto from "node:crypto";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, getDoc, deleteDoc, serverTimestamp, arrayUnion, runTransaction } from "firebase/firestore";

const ADMIN = "admin@test.dev";
let rules = fs.readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
// test admin instead of the real one (same mechanism: SHA-256 of the e-mail)
rules = rules.replace(/in \["[0-9a-f]{64}"\]/, `in ["${crypto.createHash("sha256").update(ADMIN).digest("hex")}"]`);
const env = await initializeTestEnvironment({ projectId: "demo-rngworld", firestore: { rules, host: "127.0.0.1", port: 8080 } });

let failed = 0;
async function check(name, p){
  try { await p; console.log("ok    " + name); }
  catch (e){ failed++; console.log(`::error::${name} -> ${String(e && e.message || e).replace(/\s+/g, " ")}`); }
}
const user = (uid, email) => env.authenticatedContext(uid, { email: email || uid + "@test.dev", email_verified: true }).firestore();
const day = Math.floor(Date.now() / 864e5);
const profile = p => ({ pseudo: p, pl: p, color: "#E8573F", avatar: "", cities: [], joined: Date.now(), today: { d: "x", used: 0, cur: null, kept: null, seen: [] } });
const seed = async (path, data) => env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), path), data));
const draws = async (db, uid) => (await getDoc(doc(db, "players/" + uid))).data().draws;
async function keep(db, uid, id, at, kd){
  return runTransaction(db, async tx => {
    const cref = doc(db, "claims/" + id); await tx.get(cref);
    tx.set(cref, { uid, t: Date.now() });
    tx.update(doc(db, "players/" + uid), { cities: arrayUnion({ id, t: Date.now(), at }), keepDay: kd });
  });
}

const alice = user("alice"), bob = user("bob"), admin = user("boss", ADMIN);
const A = doc(alice, "players/alice");

// profiles
await check("create profile", assertSucceeds(setDoc(A, profile("alice"))));
await check("create profile with cities is refused", assertFails(setDoc(doc(bob, "players/bob"), { ...profile("bob"), cities: [{ id: 1, t: 1 }] })));
await check("create profile with draws is refused", assertFails(setDoc(doc(bob, "players/bob"), { ...profile("bob"), draws: { day, n: 0 } })));
await check("create bob", assertSucceeds(setDoc(doc(bob, "players/bob"), profile("bob"))));
await check("profile edit", assertSucceeds(setDoc(A, { pseudo: "alice2", color: "#123456" }, { merge: true })));
await check("today field write", assertSucceeds(setDoc(A, { today: { d: "y", used: 1 } }, { merge: true })));
await check("cannot write someone else", assertFails(setDoc(doc(bob, "players/alice"), { pseudo: "x" }, { merge: true })));

// draws
await check("draw 1", assertSucceeds(updateDoc(A, { draws: { day, n: 1, t1: serverTimestamp() } })));
await check("draw with a chosen time is refused", assertFails(updateDoc(A, { "draws.n": 2, "draws.t2": new Date(2020, 0, 1) })));
await check("restart the day is refused", assertFails(updateDoc(A, { draws: { day, n: 1, t1: serverTimestamp() } })));
await check("draw 2", assertSucceeds(updateDoc(A, { "draws.n": 2, "draws.t2": serverTimestamp() })));
await check("skip a number is refused", assertFails(updateDoc(A, { "draws.n": 4, "draws.t4": serverTimestamp() })));
await check("draw 3", assertSucceeds(updateDoc(A, { "draws.n": 3, "draws.t3": serverTimestamp() })));
await check("draw 4 is refused", assertFails(updateDoc(A, { "draws.n": 4, "draws.t4": serverTimestamp() })));
await check("draw far in the future is refused", assertFails(updateDoc(A, { draws: { day: day + 5, n: 1, t1: serverTimestamp() } })));
await check("rewrite an old draw time is refused", assertFails(updateDoc(A, { "draws.t1": serverTimestamp() })));

// keeps
let d = await draws(alice, "alice");
await check("keep an older draw is refused", assertFails(keep(alice, "alice", 1001, d.t2, d.day)));
await check("keep with wrong keepDay is refused", assertFails(keep(alice, "alice", 1001, d.t3, d.day + 1)));
await check("claim without keep is refused", assertFails(setDoc(doc(alice, "claims/1002"), { uid: "alice", t: 1 })));
await check("keep latest draw", assertSucceeds(keep(alice, "alice", 1001, d.t3, d.day)));
await check("second keep same day is refused", assertFails(keep(alice, "alice", 1003, d.t3, d.day)));
await check("cities cannot be removed", assertFails(updateDoc(A, { cities: [] })));
await check("claim cannot be stolen", assertFails(keep(bob, "bob", 1001, null, day)));
await check("claim cannot be updated", assertFails(setDoc(doc(bob, "claims/1001"), { uid: "bob", t: 1 })));
await check("profile edit after keep", assertSucceeds(setDoc(A, { color: "#654321" }, { merge: true })));

// isolate: empty collection + 1 draw, and a non-empty collection + 3 draws
await seed("players/eve", profile("eve"));
const eve = user("eve"), E = doc(eve, "players/eve");
await check("eve draw", assertSucceeds(updateDoc(E, { draws: { day, n: 1, t1: serverTimestamp() } })));
d = await draws(eve, "eve");
await check("eve keep (empty collection, 1 draw)", assertSucceeds(keep(eve, "eve", 4001, d.t1, d.day)));
await seed("players/fay", { ...profile("fay"), cities: [{ id: 9, t: 1 }] });
const fay = user("fay"), F = doc(fay, "players/fay");
await check("fay draw 1", assertSucceeds(updateDoc(F, { draws: { day, n: 1, t1: serverTimestamp() } })));
await check("fay draw 2", assertSucceeds(updateDoc(F, { "draws.n": 2, "draws.t2": serverTimestamp() })));
await check("fay draw 3", assertSucceeds(updateDoc(F, { "draws.n": 3, "draws.t3": serverTimestamp() })));
d = await draws(fay, "fay");
await check("fay keep (1 city, 3 draws)", assertSucceeds(keep(fay, "fay", 5001, d.t3, d.day)));

// next day
await seed("players/carol", { ...profile("carol"), cities: [{ id: 5, t: 1 }], keepDay: day - 1, draws: { day: day - 1, n: 3, t1: new Date(), t2: new Date(), t3: new Date() } });
const carol = user("carol"), C = doc(carol, "players/carol");
await check("new day draw", assertSucceeds(updateDoc(C, { draws: { day, n: 1, t1: serverTimestamp() } })));
d = await draws(carol, "carol");
await check("new day keep", assertSucceeds(keep(carol, "carol", 2001, d.t1, d.day)));

// legacy player (no draws yet, old keepDay)
await seed("players/dan", { ...profile("dan"), cities: [{ id: 7, t: 1 }], keepDay: day - 3 });
const dan = user("dan"), Dn = doc(dan, "players/dan");
await check("legacy player first draw", assertSucceeds(updateDoc(Dn, { draws: { day, n: 1, t1: serverTimestamp() } })));
d = await draws(dan, "dan");
await check("legacy player keep", assertSucceeds(keep(dan, "dan", 3001, d.t1, d.day)));

// admin
await check("admin clears a collection", assertSucceeds(updateDoc(doc(admin, "players/alice"), { cities: [] })));
await check("admin deletes a claim", assertSucceeds(deleteDoc(doc(admin, "claims/1001"))));
await check("non admin cannot clear others", assertFails(updateDoc(doc(bob, "players/carol"), { cities: [] })));

// reads
await check("signed-in can read players", assertSucceeds(getDoc(doc(bob, "players/alice"))));
await check("guest can read claims", assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), "claims/2001"))));
await check("guest cannot read players", assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "players/alice"))));

await env.cleanup();
console.log(failed ? `${failed} check(s) failed` : "all checks passed");
process.exit(failed ? 1 : 0);
