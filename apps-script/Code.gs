/**
 * Proddatur Pulse — public intake and private operations.
 * Web app deployment: Execute as owner; access: Anyone.
 * Registrations are unique by normalized 10-digit Indian mobile number.
 * Questions/privacy requests are stored separately and do not create registrations.
 */
const CONFIG = {
  SPREADSHEET_ID: "10SiohQdenk7ECSNV4WW61_Un5oMv9JrdR1VnEmpQ6Fk",
  REGISTRATIONS_SHEET: "Registrations",
  REQUESTS_SHEET: "Requests",
  DASHBOARD_SHEET: "Dashboard",
  MAX_BODY_LENGTH: 12000
};
const REGISTRATION_HEADERS = ["Submitted At","Mobile (normalized)","Name","Age Group","Area","Interests","Timeline","Willingness To Pay","Suggestion","Consent","Marketing Updates"];
const REQUEST_HEADERS = ["Received At","Request Type","Mobile (normalized)","Message","Status"];
const ALLOWED_INTERESTS = new Set(["Social mixers","Game nights","Fitness and running groups","Sports meetups","Student and career community","Rental homes and rooms","Local services and deals","Weekend trips and outings","Other"]);
const ALLOWED_AGES = new Set(["18–24","25–34","35–44","45+",""]);

function setupSheet() {
  const ss = getSpreadsheet_();
  const registrations = getOrCreateSheet_(ss, CONFIG.REGISTRATIONS_SHEET);
  ensureHeaders_(registrations, REGISTRATION_HEADERS);
  styleHeader_(registrations, REGISTRATION_HEADERS.length);
  const requests = getOrCreateSheet_(ss, CONFIG.REQUESTS_SHEET);
  ensureHeaders_(requests, REQUEST_HEADERS);
  styleHeader_(requests, REQUEST_HEADERS.length);
  setupDashboard_(ss);
  return "Setup complete. Registrations, Requests and Dashboard tabs are ready.";
}
function doGet() {
  return HtmlService.createHtmlOutput("Proddatur Pulse intake endpoint is running.");
}
function doPost(e) {
  let result;
  try {
    const raw = e && e.parameter && e.parameter.payload;
    if (!raw || raw.length > CONFIG.MAX_BODY_LENGTH) {
      result = {ok:false,code:"invalid_request",message:"Invalid submission. Please review the form."};
    } else {
      const payload = JSON.parse(raw);
      result = payload && payload.type === "request" ? saveRequest_(payload) : saveRegistration_(payload);
    }
  } catch (err) {
    console.error("Submission error: " + err);
    result = {ok:false,code:"server_error",message:"We could not process your submission. Please try again later."};
  }
  return responsePage_(result, e && e.parameter && e.parameter.nonce);
}

function saveRegistration_(d) {
  if (d && d.website) return {ok:true,code:"accepted",message:"Thank you. Your interest has been received."};
  const name = clean_(d.name,80);
  const phone = normalizePhone_(d.phone);
  const age = clean_(d.age,30);
  const area = clean_(d.area,80);
  const timeline = clean_(d.timeline,40);
  const willingness = clean_(d.willingness_to_pay,40);
  const suggestion = clean_(d.suggestion,500);
  const interests = Array.isArray(d.interests) ? [...new Set(d.interests.filter(x => ALLOWED_INTERESTS.has(x)))].slice(0,9) : [];
  if (!name || !isValidPhone_(phone) || !ALLOWED_AGES.has(age) || interests.length === 0 || d.consent !== true) {
    return {ok:false,code:"validation_error",message:"Please check your details, choose at least one interest and provide consent. Registrations are for adults aged 18 and above."};
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return {ok:false,code:"busy",message:"The form is busy. Please try again in a few seconds."};
  try {
    const sheet = getOrCreateSheet_(getSpreadsheet_(), CONFIG.REGISTRATIONS_SHEET);
    ensureHeaders_(sheet, REGISTRATION_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const match = sheet.getRange(2,2,lastRow-1,1).createTextFinder(phone).matchEntireCell(true).useRegularExpression(false).findNext();
      if (match) return {ok:false,code:"duplicate",message:"This mobile number has already registered. Only one registration per mobile number is allowed."};
    }
    sheet.appendRow([new Date(),phone,safeCell_(name),age,safeCell_(area),interests.join(", "),timeline,willingness,safeCell_(suggestion),true,d.marketing_updates === true]);
    return {ok:true,code:"created",message:"Thank you. Your interest has been received successfully."};
  } finally {
    lock.releaseLock();
  }
}

function saveRequest_(d) {
  if (d && d.website) return {ok:true,code:"accepted",message:"Your message has been received."};
  const phone = normalizePhone_(d.phone);
  const type = clean_(d.request_type,32);
  const message = clean_(d.message,1000);
  const allowedTypes = new Set(["Question","Suggestion","Access my data","Correct my data","Delete my data","Stop optional updates"]);
  if (!isValidPhone_(phone) || !allowedTypes.has(type) || message.length < 3) {
    return {ok:false,code:"validation_error",message:"Enter the 10-digit mobile number used for registration, choose a request type and add a short message."};
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return {ok:false,code:"busy",message:"The request form is busy. Please try again shortly."};
  try {
    const sheet = getOrCreateSheet_(getSpreadsheet_(), CONFIG.REQUESTS_SHEET);
    ensureHeaders_(sheet, REQUEST_HEADERS);
    sheet.appendRow([new Date(),type,phone,safeCell_(message),"New"]);
    return {ok:true,code:"request_received",message:"Your message has been received. The project operator will review it. For access, correction or deletion requests, we may verify control of the registered mobile number before taking action."};
  } finally {
    lock.releaseLock();
  }
}

function setupDashboard_(ss) {
  const sheet = getOrCreateSheet_(ss, CONFIG.DASHBOARD_SHEET);
  sheet.clear();
  sheet.getRange("A1:B1").merge().setValue("PRODDATUR PULSE — PRIVATE OWNER DASHBOARD");
  sheet.getRange("A1").setFontWeight("bold").setFontSize(14).setBackground("#123b32").setFontColor("#ffffff");
  sheet.getRange("A3:B8").setValues([
    ["Metric","Current value"],
    ["Total registrations",""],
    ["Unique registered mobile numbers",""],
    ["New questions/privacy requests",""],
    ["Optional update opt-ins",""],
    ["Last refreshed",""]
  ]);
  sheet.getRange("B4").setFormula('=COUNTA(Registrations!B2:B)');
  sheet.getRange("B5").setFormula('=IFERROR(COUNTUNIQUE(FILTER(Registrations!B2:B,Registrations!B2:B<>"")),0)');
  sheet.getRange("B6").setFormula('=COUNTIF(Requests!E2:E,"New")');
  sheet.getRange("B7").setFormula('=COUNTIF(Registrations!K2:K,TRUE)');
  sheet.getRange("B8").setFormula("=NOW()");
  sheet.getRange("A10:B10").setValues([["Demand by interest","Registrations"]]);
  sheet.getRange("A11").setFormula('=IFERROR(QUERY(ARRAYFORMULA(TRIM(FLATTEN(SPLIT(TEXTJOIN(",",TRUE,Registrations!F2:F),",")))),"select Col1,count(Col1) where Col1 is not null group by Col1 order by count(Col1) desc label Col1 \'Interest\', count(Col1) \'Registrations\'",0),"No registrations yet")');
  sheet.getRange("D10:E10").setValues([["Demand by area","Registrations"]]);
  sheet.getRange("D11").setFormula('=IFERROR(QUERY(Registrations!E2:E,"select Col1,count(Col1) where Col1 is not null group by Col1 order by count(Col1) desc label Col1 \'Area\', count(E) \'Registrations\'",0),"No area data yet")');
  sheet.getRange("G10:H10").setValues([["Willingness to pay","Registrations"]]);
  sheet.getRange("G11").setFormula('=IFERROR(QUERY(Registrations!H2:H,"select Col1,count(Col1) where Col1 is not null group by Col1 order by count(Col1) desc label Col1 \'Price range\', count(H) \'Registrations\'",0),"No pricing data yet")');
  sheet.getRange("J10:K10").setValues([["Usage timeline","Registrations"]]);
  sheet.getRange("J11").setFormula('=IFERROR(QUERY(Registrations!G2:G,"select Col1,count(Col1) where Col1 is not null group by Col1 order by count(Col1) desc label Col1 \'Timeline\', count(G) \'Registrations\'",0),"No timeline data yet")');
  ["A3:B3","A10:B10","D10:E10","G10:H10","J10:K10"].forEach(r=>sheet.getRange(r).setFontWeight("bold").setBackground("#d9f36b"));
  sheet.setFrozenRows(3);
  sheet.autoResizeColumns(1,11);
  sheet.getRange("B8").setNumberFormat("dd mmm yyyy hh:mm");
  sheet.getRange("A13").setValue("Owner workflow: review Requests tab, verify the mobile number before fulfilling access/correction/deletion requests, then change Status to In progress or Resolved.");
  sheet.getRange("A13:K13").merge().setWrap(true);
}

function getSpreadsheet_() {
  if (!CONFIG.SPREADSHEET_ID) throw new Error("Missing spreadsheet configuration.");
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}
function getOrCreateSheet_(ss,name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
function ensureHeaders_(sheet,headers) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    return;
  }
  const current = sheet.getRange(1,1,1,headers.length).getDisplayValues()[0];
  if (current.join("|") !== headers.join("|")) throw new Error("Unexpected headers in " + sheet.getName() + ". Existing data was not changed.");
}
function styleHeader_(sheet,width) {
  sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,width).setFontWeight("bold").setBackground("#123b32").setFontColor("#ffffff");
}
function normalizePhone_(value) {
  return String(value || "").replace(/\D/g,"");
}
function isValidPhone_(phone) {
  return /^[6-9][0-9]{9}$/.test(phone);
}
function clean_(value,max) {
  return String(value == null ? "" : value).replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max);
}
function safeCell_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}
function responsePage_(result,nonce) {
  const message = JSON.stringify({type:"PRODDATUR_PULSE_RESULT",nonce:String(nonce || ""),result:result}).replace(/</g,"\\u003c");
  const html = '<!doctype html><html><body><script>window.top.postMessage(' + message + ',"*");</script></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
