/* RNGWorld configuration.
   The Firebase keys below are public by design: security comes from the Firestore rules (firestore.rules).
   `admins`: put your own e-mail address here (same one as in firestore.rules). It will be visible in the public repository. */
window.RNG_CONFIG = {
  firebase: {
    apiKey: "AIzaSyDiOZEfF1WOMUi0ka-nu50DCx_PNcYWLe4",
    authDomain: "rngworld-84f7e.firebaseapp.com",
    projectId: "rngworld-84f7e",
    storageBucket: "rngworld-84f7e.firebasestorage.app",
    messagingSenderId: "580612092971",
    appId: "1:580612092971:web:2a8e86950679b0c1aaa66e"
  },
  admins: ["admin@example.com"]
};
