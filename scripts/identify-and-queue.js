// identify-and-queue — Twilio Function
// Plak deze code in de Twilio Console onder Functions > Services.
//
// Vereisten:
//   1. Upload data/customers.json als PRIVATE Asset in dezelfde Function Service.
//   2. Environment variables: WORKSPACE_SID, WORKFLOW_SID
//
// Hoe te uploaden:
//   Twilio Console → Functions → jouw service → Assets-tab →
//   "Add +" → kies customers.json → stel in op "Private" → Deploy.

const fs = require("fs");

// Module-scope cache: leeft zolang de container warm is (minuten tot uren).
let _customers = null;

function loadCustomers() {
  if (_customers) return _customers;
  const assetPath = Runtime.getAssets()["/customers.json"].path;
  _customers = JSON.parse(fs.readFileSync(assetPath, "utf8"));
  return _customers;
}

function normalizePhone(raw) {
  if (!raw) return "";
  let s = String(raw).replace(/[\s\-()./]/g, "");
  if (s.startsWith("+")) return s;
  if (s.startsWith("00")) return "+" + s.slice(2);
  if (s.startsWith("31") && s.length >= 11) return "+" + s;
  if (s.startsWith("0")) return "+31" + s.slice(1);
  return "+31" + s;
}

exports.handler = async function (context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  const caller = normalizePhone(event.From);

  // Lookup in verrijkt klantenbestand
  let customer = null;
  try {
    const db = loadCustomers();
    customer = db.byPhone[caller] ?? null;

    // Fallback: beller geeft klantnummer in via IVR (toekomstig)
    // const byNr = db.byCustomerNumber[event.Digits];
    // if (!customer && byNr) customer = db.byPhone[byNr] ?? null;
  } catch (e) {
    console.error("customers.json laden mislukt:", e.message);
  }

  // Onbekende beller → minimale defaults
  const c = customer ?? {
    customerId: null,
    customerNumber: null,
    phone: event.From,
    name: "Onbekende klant",
    email: null,
    segment: "Onbekend",
    tag: null,
    customerValueScore: 30,
    priority: 0,
    churnRiskScore: 0,
    churnSegment: null,
    propensityScore: 0,
    propensitySegment: null,
    products: null,
    numProducts: 0,
    isMultiUtility: false,
    tariffType: null,
    tenureMonths: 0,
    contractEnding90d: false,
    actions: [],
  };

  const client = context.getTwilioClient();
  await client.taskrouter.v1
    .workspaces(context.WORKSPACE_SID)
    .tasks.create({
      attributes: JSON.stringify({
        // Kern (wachtrij + dashboard-header)
        from: event.From,
        call_sid: event.CallSid,
        customerName: c.name,
        segment: c.segment,
        tag: c.tag,
        customerValueScore: c.customerValueScore,
        reason: event.reason ?? "Algemene vraag",
        // Verrijkte velden (dashboard-detail + acties)
        customerId: c.customerId,
        customerNumber: c.customerNumber,
        email: c.email,
        churnRiskScore: c.churnRiskScore,
        churnSegment: c.churnSegment,
        propensityScore: c.propensityScore,
        propensitySegment: c.propensitySegment,
        products: c.products,
        numProducts: c.numProducts,
        isMultiUtility: c.isMultiUtility,
        tariffType: c.tariffType,
        tenureMonths: c.tenureMonths,
        contractEnding90d: c.contractEnding90d,
        actions: c.actions,
      }),
      workflowSid: context.WORKFLOW_SID,
      priority: c.priority,
      taskChannel: "voice",
    });

  const greeting = c.firstName || (c.name === "Onbekende klant" ? null : c.name.split(" ")[0]);
  twiml.say(
    { language: "nl-NL" },
    greeting
      ? `Hey ${greeting}, je spreekt met Budget Thuis, je wordt zo snel mogelijk geholpen.`
      : `Welkom bij Budget Thuis, je wordt zo snel mogelijk geholpen.`
  );
  twiml.play({ loop: 0 }, "https://ivr-priority-demo-9913.twil.io/Music.mp3");
  callback(null, twiml);
};
