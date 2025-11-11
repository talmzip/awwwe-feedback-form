const SHEET_NAME = "Sheet1"; // Update if your sheet uses a different tab name.

function doPost(e) {
  try {
    let body;

    // Handle URL-encoded form data
    if (e.parameter && e.parameter.data) {
      body = JSON.parse(decodeURIComponent(e.parameter.data));
    }
    // Fallback to raw POST body
    else if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    else {
      throw new Error("No data received");
    }

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
  const output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}


