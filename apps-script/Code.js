const SHEET_NAME = "Sheet1"; // Update if your sheet uses a different tab name.

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    const timestamp = new Date();
    const values = body.answers?.map((entry) => entry.value?.trim() ?? "") ?? [];

    sheet.appendRow([timestamp, ...values]);

    return jsonResponse({ status: "ok" });
  } catch (error) {
    return jsonResponse({
      status: "error",
      message: error.message,
    });
  }
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}


