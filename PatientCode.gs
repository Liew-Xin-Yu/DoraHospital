//CONSTANTS
const SPREADSHEETID = "1Y5dYrIhQtabf0JNcRwfPGsbnfHa4Lk7GuWXS0l7EUp4";
const DATARANGE = "Patient!A2:I";
const DATASHEET = "Patient";
const DATASHEETID = "0";
const LASTCOL = "I";
const IDRANGE = "Patient!A2:A2000";
const DROPDOWNRANGE = "Treatment!A2:A195"; //TREATMENT LIST

//Display HTML page
function doGet(request) {
  let html = HtmlService.createTemplateFromFile('PatientIndex').evaluate();
  let htmlOutput = HtmlService.createHtmlOutput(html);
  htmlOutput.addMetaTag('viewport', 'width=device-width, initial-scale=1');
  return htmlOutput;
}

//PROCESS SUBMITTED FORM DATA
function processForm(formObject) {
  if (formObject.recId && checkId(formObject.recId)) {
    const values = [[
      formObject.recId,
      formObject.name,
      formObject.dob,
      formObject.age,
      formObject.ic,
      formObject.address,
      formObject.phone,
      formObject.email,
      formObject.treatment,
    ]];
    const updateRange = getRangeById(formObject.recId);
    //Update the record
    updateRecord(values, updateRange);
  } else {
    //Prepare new row of data
    let values = [[
      generateUniqueId(),
      formObject.name,
      formObject.dob,
      formObject.age,
      formObject.ic,
      formObject.address,
      formObject.phone,
      formObject.email,
      formObject.treatment,
    ]];

    //Create new record
    createRecord(values);
  }

  //Return the last 10 records
  return getLastTenRecords();
}


function createRecord(values) {
  try {
    let valueRange = Sheets.newRowData();
    valueRange.values = values;

    let appendRequest = Sheets.newAppendCellsRequest();
    appendRequest.sheetId = SPREADSHEETID;
    appendRequest.rows = valueRange;

    Sheets.Spreadsheets.Values.append(valueRange, SPREADSHEETID, DATARANGE, { valueInputOption: "RAW" });
  } catch (err) {
    console.log('Failed with error %s', err.message);
  }
}

function readRecord(range) {
  try {
    let result = Sheets.Spreadsheets.Values.get(SPREADSHEETID, range);
    return result.values;
  } catch (err) {
    console.log('Failed with error %s', err.message);
  }
}

function updateRecord(values, updateRange) {
  try {
    let valueRange = Sheets.newValueRange();
    valueRange.values = values;
    console.log("Values to update: ", values); // Debugging line
    Sheets.Spreadsheets.Values.update(valueRange, SPREADSHEETID, updateRange, { valueInputOption: "RAW" });
  } catch (err) {
    console.log('Failed with error %s', err.message);
  }
}

function deleteRecord(id) {
  const rowToDelete = getRowIndexById(id);
  const deleteRequest = {
    "deleteDimension": {
      "range": {
        "sheetId": DATASHEETID,
        "dimension": "ROWS",
        "startIndex": rowToDelete,
        "endIndex": rowToDelete + 1
      }
    }
  };
  Sheets.Spreadsheets.batchUpdate({ "requests": [deleteRequest] }, SPREADSHEETID);
  return getLastTenRecords();
}

function getLastTenRecords() {
  let lastRow = readRecord(DATARANGE).length + 1;
  let startRow = lastRow - 9;
  if (startRow < 2) { //If less than 10 records, eleminate the header row and start from second row
    startRow = 2;
  }
  let range = DATASHEET + "!A" + startRow + ":" + LASTCOL + lastRow;
  let lastTenRecords = readRecord(range);
  Logger.log(lastTenRecords);
  return lastTenRecords;
}


//GET ALL RECORDS
function getAllRecords() {
  const allRecords = readRecord(DATARANGE);
  return allRecords;
}

//GET RECORD FOR THE GIVEN ID
function getRecordById(id) {
  if (!id || !checkId(id)) {
    console.log("Invalid ID: ", id); // Debugging line
    return null;
  }
  const range = getRangeById(id);
  if (!range) {
    console.log("No range found for ID: ", id); // Debugging line
    return null;
  }
  const result = readRecord(range);
  console.log("Record result: ", result); // Debugging line
  return result;
}

function getRowIndexById(id) {
  if (!id) {
    throw new Error('Invalid ID');
  }

  const idList = readRecord(IDRANGE);
  for (var i = 0; i < idList.length; i++) {
    if (id == idList[i][0]) {
      var rowIndex = parseInt(i + 1);
      return rowIndex;
    }
  }
}


//VALIDATE ID
function checkId(id) {
  const idList = readRecord(IDRANGE).flat();
  return idList.includes(id);
}


//GET DATA RANGE IN A1 NOTATION FOR GIVEN ID
function getRangeById(id) {
  if (!id) {
    console.log("Invalid ID: ID is null or undefined"); // Debugging line
    return null;
  }
  const idList = readRecord(IDRANGE);
  console.log("ID List: ", idList); // Debugging line
  const rowIndex = idList.findIndex(item => item[0] === id);
  if (rowIndex === -1) {
    console.log("ID not found in ID list: ", id); // Debugging line
    return null;
  }
  const range = `Data!A${rowIndex + 2}:${LASTCOL}${rowIndex + 2}`;
  console.log("Range for ID: ", range); // Debugging line
  return range;
}


//INCLUDE HTML PARTS, EG. JAVASCRIPT, CSS, OTHER HTML FILES
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent();
}

//GENERATE UNIQUE ID
function generateUniqueId() {
  let id = Utilities.getUuid();
  return id;
}

function getTreatmentList() {
  treatmentList = readRecord(DROPDOWNRANGE);
  return treatmentList;
}

//SEARCH RECORDS
function searchRecords(formObject) {
  let result = [];
  try {
    if (formObject.searchText) {//Execute if form passes search text
      const data = readRecord(DATARANGE);
      const searchText = formObject.searchText;

      // Loop through each row and column to search for matches
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const cellValue = data[i][j];
          if (cellValue.toLowerCase().includes(searchText.toLowerCase())) {
            result.push(data[i]);
            break; // Stop searching for other matches in this row
          }
        }
      }
    }
  } catch (err) {
    console.log('Failed with error %s', err.message);
  }
  return result;
}

