/**
 * Proddatur Pulse Google Sheets intake.
 * Deploy as Web App: Execute as Me; Who has access: Anyone.
 * Duplicate policy: one registration per normalized 10-digit mobile number.
 */
const CONFIG = {
  SPREADSHEET_ID: "PASTE_YOUR_GOOGLE_SPREADSHEET_ID_HERE",
  SHEET_NAME: "Registrations",
  MAX_BODY_LENGTH: 12000
};
const HEADERS = ["Submitted At","Mobile (normalized)","Name","Age Group","Area","Interests","Timeline","Willingness To Pay","Suggestion","Consent","Marketing Updates"];
const ALLOWED_INTERESTS = new Set(["Social mixers","Game nights","Fitness and running groups","Sports meetups","Student and career community","Rental homes and rooms","Local services and deals","Weekend trips and outings","Other"]);

function setupSheet() {
  const sheet = getSheet_();
  ensureHeaders_(sheet);
  sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,HEADERS.length).setFontWeight("bold");
  return "Setup complete: " + sheet.getName();
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
      result = saveRegistration_(JSON.parse(raw));
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
  const phone = String(d.phone || "").replace(/\D/g,"");
  const age = clean_(d.age,30);
  const area = clean_(d.area,80);
  const timeline = clean_(d.timeline,40);
  const willingness = clean_(d.willingness_to_pay,40);
  const suggestion = clean_(d.suggestion,500);
  const interests = Array.isArray(d.interests) ? [...new Set(d.interests.filter(x => ALLOWED_INTERESTS.has(x)))].slice(0,9) : [];
  if (!name || !/^[6-9][0-9]{9}$/.test(phone) || interests.length === 0 || d.consent !== true) {
    return {ok:false,code:"validation_error",message:"Please check your name, mobile number, interests and consent."};
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return {ok:false,code:"busy",message:"The form is busy. Please try again in a few seconds."};
  try {
    const sheet = getSheet_();
    ensureHeaders_(sheet);
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const match = sheet.getRange(2,2,lastRow-1,1).createTextFinder(phone).matchEntireCell(true).useRegularExpression(false).findNext();
      if (match) return {ok:false,code:"duplicate",message:"This mobile number has already registered. Only one registration per mobile number is allowed."};
    }
    const nextRow = sheet.getLastRow() + 1;\n    sheet.getRange(nextRow,2).setNumberFormat("@");\n    sheet.appendRow([new Date(),phone,safeCell_(name),age,safeCell_(area),interests.join(", "),timeline,willingness,safeCell_(suggestion),true,d.marketing_updates === true]);
    return {ok:true,code:"created",message:"Thank you. Your interest has been received successfully."};
  } finally {
    lock.releaseLock();
  }
}
function getSheet_() {
  if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID.indexOf("PASTE_") === 0) throw new Error("Set CONFIG.SPREADSHEET_ID before deployment.");
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  return ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
}
function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    return;
  }
  const current = sheet.getRange(1,1,1,HEADERS.length).getDisplayValues()[0];
  if (current.join("|") !== HEADERS.join("|")) throw new Error("Unexpected sheet headers. Existing data was not changed.");
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
