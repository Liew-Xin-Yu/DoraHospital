const spreadsheetID = '1gZan6A3HwYnIaDXa72za8wiYMuCZJDqn2IEbbJKeyVk';
const ss = SpreadsheetApp.openById(spreadsheetID);
const sheet = ss.getSheets()[0];
const feedbackSheet = ss.getSheetByName('Feedback');  
const patientSheet = ss.getSheetByName('Patient'); 
const bookingSheet = ss.getSheetByName('Booking');
const PillSheet = ss.getSheetByName('Pills');


// Database Methods
const getData = () => {
  const data = sheet.getDataRange().getValues();
  const fields = data.shift();
  return data.map(row => {
    return row.reduce((obj, value, index) => {
      obj[fields[index]] = value;
      return obj;
    }, {});
  });
};

function getBookingData(bookingId) {
  var sheet = ss.getSheetByName('Booking');
  if (!sheet) {
    Logger.log('Booking sheet not found');
    return null;
  }
  
  var data = sheet.getDataRange().getValues();
  Logger.log('Data from Booking sheet: ' + JSON.stringify(data));
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().toLowerCase().trim() === bookingId.toLowerCase().trim()) {
      return {
        name: data[i][2],       // Assuming patient name is in the third column
        mobileNo: data[i][3],   // Assuming mobile number is in the fourth column
        date: data[i][5],       // Assuming date is in the sixth column
        time: data[i][6],       // Assuming time is in the seventh column
        doctor: data[i][7]      // Assuming doctor is in the eighth column
      };
    }
  }
  Logger.log('Booking ID not found: ' + bookingId);
  return null;
}



function getBookingDetails(bookingId) {
  const data = bookingSheet.getDataRange().getValues();
  const headers = data.shift();
  const booking = data.find(row => row[0] === bookingId); // Assuming the first column contains the Booking ID
  if (booking) {
    const bookingDetails = headers.reduce((obj, header, index) => {
      obj[header] = booking[index];
      return obj;
    }, {});
    return bookingDetails;
  }
  return null; // Ensure to return null if booking is not found
}


//pill
function getAllPillNames() {
  var sheet = ss.getSheetByName('Pills');
  var data = sheet.getDataRange().getValues();
  var pillNames = [];
  for (var i = 1; i < data.length; i++) {
    pillNames.push(data[i][1]); // Assuming Pill Name is in the second column
  }
  return pillNames;
}

function getPillData(pillName) {
  var sheet = ss.getSheetByName('Pills');
  var data = sheet.getDataRange().getValues();
  
  Logger.log('Data from Pills sheet: ' + JSON.stringify(data)); // Log data
  
  for (var i = 1; i < data.length; i++) {
    Logger.log('Checking pill name: ' + data[i][1]); 
    if (data[i][1] && data[i][1].toLowerCase().trim() === pillName.toLowerCase().trim()) {
      return {
        pricePerPill: parseFloat(data[i][4]), // Assuming price is in the fifth column
        dosage: data[i][2] // Assuming dosage is in the third column
      };
    }
  }
  Logger.log('Pill not found: ' + pillName);
  return null;
}


function getAllBookingIds() {
  const sheet = ss.getSheetByName('Booking');
  const data = sheet.getDataRange().getValues();
  return data.slice(1).map(row => row[0]); // Assuming the first column 
}

const getUserByEmail = (email) => {
  return getData().find(user => user.email === email);
};

const loginUser = (email, password) => {
  const user = getUserByEmail(email);
  if (user && user.password === password) {
    return { email: user.email, role: user.role, name: user.name };
  }
  return null;
};


const signUpUser = (form) => {
  const data = sheet.getDataRange().getValues();
  const lastRow = data.length;
  const lastID = lastRow > 1 ? data[lastRow - 1][0] : 0;
  const newID = lastID + 1;

  const user = getUserByEmail(form.email);
  if (user) {
    return { success: false, message: 'User already exists' };
  } else {
    sheet.appendRow([newID, form.name, form.email, form.role, form.password, form.mobileNo, form.icNum]);
    return { success: true, message: 'Sign up successful' };
  }
};


const userFeedback = (form) => {
  const data = feedbackSheet.getDataRange().getValues();
  const lastRow = data.length;
  const lastID = lastRow > 1 ? data[lastRow - 1][0] : 0;
  const newID = lastID + 1;

  feedbackSheet.appendRow([newID, form.doctorName, form.rating, form.comment]);
  return { success: true, message: 'Feedback successful' };
};

const userBooking = (form) => {
  const data = bookingSheet.getDataRange().getValues();
  const lastRow = data.length;
  const lastID = lastRow > 1 ? data[lastRow - 1][0] : 0;
  const newID = lastID + 1;
  let email = form.email;
  let title = "Appointment";
  let startDate = form.date;
  let startTime = form.time;

  let startDateTime = new Date(startDate + "T" + startTime);
  let endDateTime = new Date(startDateTime);
  endDateTime.setHours(startDateTime.getHours() + 1);

  try {
    let calendar = CalendarApp.getCalendarById(email);

    if (calendar) {
      calendar.createEvent(
        title,
        startDateTime,
        endDateTime
      );
      Logger.log(`Event created for ${email}`);
    } else {
      Logger.log(`No calendar found for email: ${email}`);
    }
  } catch (error) {
    Logger.log(`Error creating event: ${error.message}`);
  }

  bookingSheet.appendRow([newID, form.name, form.email, form.mobileNo, form.symptoms, form.date, form.time, form.selectDoctor]);
  return { success: true, message: 'Booking successful' };
};



const getUserByField = (field, value) => {
  return getData().find(e => e[field] == value);
};

const getUserInfo = () => {
  const userEmail = Session.getActiveUser().getEmail();
  return getUserByField('email', userEmail);
};

function getUserEmail() {
  return Session.getActiveUser().getEmail();
}


function getLatestAppointments() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Booking');
    const data = sheet.getDataRange().getValues();
    const sorted = data.sort((a, b) => new Date(b[0]) - new Date(a[0])); // Assuming the date is in the first column
    return sorted.slice(0, 5).map(appointment => ({
        date: appointment[0],
        symptoms: appointment[1],
        category: appointment[2], // Make sure you have this category field or adapt as needed
        doctor: appointment[3],
        status: appointment[4] // Assuming status is in the fifth column
    }));
}

function getAppointmentsByEmail(email) {
    const bookingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Appointments"); // Replace "Appointments" with your actual sheet name if different
    const allData = bookingSheet.getDataRange().getValues();
    const filteredData = allData.filter((row, index) => index > 0 && row[1].trim().toLowerCase() === email.trim().toLowerCase()); // Assuming email is in the second column (B), and skipping the header row
    filteredData.sort((a, b) => new Date(b[4]) - new Date(a[4])); // Sort by date descending, assuming date is in the fifth column (E)

    // Skip the most recent appointment and map the remaining
    return filteredData.slice(1).map(appointment => ({
        id: appointment[0],  // Assuming ID is in the first column (A)
        email: appointment[1], // Email
        name: appointment[2], // Name
        mobileNo: appointment[3], // Mobile Number
        symptom: appointment[4], // Symptom, previously 'category'
        date: appointment[5], // Date
        time: appointment[6], // Time
        doctor: appointment[7] // Doctor, assuming doctor's name is in the eighth column (H)
    }));
}

// Web App Methods
function doGet(e) {
  var page = e.parameter.page;
  var html;
  if (page == "profile") {
    html = HtmlService.createTemplateFromFile('profile').evaluate();
  } else if (page == "booking") {
    html = HtmlService.createTemplateFromFile('booking').evaluate();
  } else if (page == "history") {
    html = HtmlService.createTemplateFromFile('history').evaluate();
  } else if (page == "feedback") {
    html = HtmlService.createTemplateFromFile('feedback').evaluate();
  } else {
    html = HtmlService.createTemplateFromFile('index').evaluate();
  }
  return html.addMetaTag('viewport', 'width=device-width, initial-scale=1')
             .setTitle('Web App')
             .setFaviconUrl('https://img.icons8.com/windows/452/mandalorian.png');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


// Tests
const __test__getData = () => {
  console.log(getData());
}

const __test__getUserByField = () => {
  console.log(getUserByField('id', 2));
}

const __test__getUserInfo = () => {
  console.log(getUserInfo());
}

// Running the tests
__test__getData();
__test__getUserByField();
__test__getUserInfo();
