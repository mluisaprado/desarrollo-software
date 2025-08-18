const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
admin.initializeApp();

exports.notifyDonors = functions.firestore
  .document("requests/{requestId}")
  .onCreate(async (snap: any, context: any) => {
    const request = snap.data();
    const db = admin.firestore();

    // Buscar donantes compatibles y disponibles
    const donorsSnap = await db.collection("users")
      .where("available", "==", true)
      .where("bloodType", "in", ["O+", "O-"]) // lógica de compatibilidad
      .get();

    const tokens = donorsSnap.docs.map((d: any) => d.data().fcmToken).filter(Boolean);

    if (tokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: "Urgencia de sangre",
          body: `Se necesita ${request.bloodType} cerca tuyo.`,
        },
      });
    }
  });
