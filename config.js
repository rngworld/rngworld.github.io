/* RNGWorld configuration.
   The Firebase keys below are public by design: security comes from the Firestore rules (firestore.rules).
   `adminHashes`: SHA-256 (hex) of the admin e-mail addresses in lower case, so no address is published.
   Same values as in firestore.rules. Compute one with: printf '%s' "you@example.com" | sha256sum */
window.RNG_CONFIG = {
  firebase: {
    apiKey: "AIzaSyDiOZEfF1WOMUi0ka-nu50DCx_PNcYWLe4",
    authDomain: "rngworld-84f7e.firebaseapp.com",
    projectId: "rngworld-84f7e",
    storageBucket: "rngworld-84f7e.firebasestorage.app",
    messagingSenderId: "580612092971",
    appId: "1:580612092971:web:2a8e86950679b0c1aaa66e"
  },
  adminHashes: ["077bbeed02568422d9e722f620a838fa9f254198fdec64f00b4ea677c80bed3c"]
};
