// connected — Twilio Function
// Plak deze code in de Twilio Console onder Functions > Services (zelfde service
// als identify-and-queue). Stel de visibility in op "Public" zodat de
// calls.update() redirect uit /api/experiments/hackathon26/queue/[sid]/accept hem kan bereiken.
//
// Deze Function vervangt de wachtmuziek: de beller hoort kort "je wordt nu
// doorverbonden" en daarna stilte (geen muziek meer) — alsof de agent opneemt.
//
// Kopieer de gedeployde URL (bv. https://ivr-priority-demo-9913.twil.io/connected)
// naar de Next.js env var TWILIO_CONNECTED_URL.

exports.handler = function (context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();

  twiml.say(
    { language: "nl-NL" },
    "Je wordt nu doorverbonden met een medewerker."
  );

  // Houd de lijn open zonder muziek. pause met lange duur = stilte terwijl de
  // agent "in gesprek" is. Verleng/herhaal naar wens.
  twiml.pause({ length: 600 });

  callback(null, twiml);
};
