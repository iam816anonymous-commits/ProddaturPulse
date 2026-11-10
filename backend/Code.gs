const SHEET_NAME = "Proddatur Interests";
const HEADERS = ["Submitted At","City","Name","Mobile","Age Group","Area","Interests","Timeline","Willingness To Pay","Suggestion","Consent","Marketing Updates","Page"];

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (d.city !== "Proddatur" || d.consent !== true) throw new Error("Invalid submission");
    const name = safe(d.name,80), phone = String(d.phone || "").trim();
    const interests = Array.isArray(d.interests) ? d.interests : [];
    if (!name || !/^[6-9]\d{9}$/.test(phone) || !interests.length) throw new Error("Missing required fields");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(HEADERS); sh.setFrozenRows(1); }
    sh.appendRow([new Date(),"Proddatur",name,phone,safe(d.age,30),safe(d.area,80),interests.map(x=>safe(x,60)).join(", "),safe(d.timeline,40),safe(d.willingness_to_pay,40),safe(d.suggestion,500),"Yes",d.marketing_updates===true?"Yes":"No","proddatur"]);
    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:"Unable to save submission"})).setMimeType(ContentService.MimeType.JSON);
  }
}
function doGet() { return ContentService.createTextOutput("Proddatur Pulse endpoint is running."); }
function safe(v,n) { let s=String(v||"").trim().slice(0,n); if (/^[=+\\-@]/.test(s)) s="'"+s; return s; }
