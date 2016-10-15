var S = require('string');
var textract = require('textract');
var filePath = '9 7.pdf'
var config = {pdftotextOptions: {layout: 'raw'}};

var status = textract.fromFileWithPath(filePath, config, function(error, text) {
  if(error != null) {
    console.log(error);
  } else {
    parseText(text);
  }
});

// parseOverSpeedRecords('ANALYSIS OF OVER SPEEDS No. Time km/h No. Time km/h No. Time km/h No. Time km/h No. Time km/h No. Time km/h 1 14.10:44 101 2 10:45 106 3 17:43 118 4 17:44 123 5 15.17:45 112 6 17:46 101 7 17:47 112 8 17:48 106 ', 2, '2015-06-29 18:09');
// parseLongWaitingRecords('ANALYSIS OF LONG WAITINGS No. Get Off-On Time Dist. No. Get Off-On Time Dist. No. Get Off-On Time Dist. 1 25.00:00-10:24 7314:24 0.00 2 16.10:24-11:08 240:44 0.00 3 26.11:08-13:55 2:47 0.00 Tot. 17557:55 0.00 AA Taksi Page.1 ', 2, '2015-06-29 18:09');


function parseText(text) {
  var titles = ['COMPREHENSIVE OPERATION RECORDS', 'ANALYSIS OF HIRED DETAILS', 'ANALYSIS OF ENGINE OPERATION', 'ANALYSIS OF LONG WAITINGS', 'ANALYSIS OF OVER SPEEDS'];

  indices = getSectionIndices(text, titles);
  indices.sort(compareIndex);
  sections = getSectionData(text, indices);

  parseSectionData(sections);
}

function getSectionIndices(text, titles) {
  var indices = [];
  for(var i=0; i<titles.length; i++) {
    // Cari index tiap title di text
    var idx = 0;          // Found index di text
    var subTextIdx = 0;   // Found index di substr dari text
    var textStartIdx = 0; // Idx untuk mulai cari berikutnya
    while(subTextIdx != -1) {
      subTextIdx = text.substring(textStartIdx, text.length).search(titles[i]);
      idx = subTextIdx + textStartIdx;

      if(subTextIdx != -1) {
        indices.push({
          title: i,
          index: idx
        });
        textStartIdx = idx + titles[i].length;
      }
    }
  }

  return indices;
}

function compareIndex(a, b) {
  return a.index - b.index;
}

function getSectionData(text, indices) {
  var sections = [];
  for(var i=0; i<indices.length-1; i++) {
    sections.push({
      title: indices[i].title,
      data: text.substring(indices[i].index, indices[i+1].index)
    });
  }
  // Last element
  sections.push({
    title: indices[i].title,
    data: text.substring(indices[i].index)
  });

  return sections;
}

function parseSectionData(sections) {
  var operationRecords = []; // COMPREHENSIVE OPERATION RECORDS
  var hiredRecords = []; // ANALYSIS OF HIRED DETAILS
  var engineOperationRecords = []; // ANALYSIS OF ENGINE OPERATION
  var longWaitingRecords = []; // ANALYSIS OF LONG WAITINGS
  var overSpeedRecords = []; // ANALYSIS OF OVER SPEEDS

  var periodId = 0;
  var startDatetime = '';
  for(var i=0; i<sections.length; i++) {
    switch(sections[i].title) {
      case 0:
        periodId++;
        var operationRecord = parseOperationRecords(sections[i].data, periodId);
        startDatetime = operationRecord.start_datetime;
        operationRecords = operationRecords.concat(operationRecord);
        break;
      case 1:
        var hiredRecord = parseHiredRecords(sections[i].data, periodId, startDatetime);
        hiredRecords = hiredRecords.concat(hiredRecord);
        break;
      case 2:
        var engineOperationRecord = parseEngineOperationRecords(sections[i].data, periodId, startDatetime);
        engineOperationRecords = engineOperationRecords.concat(engineOperationRecord);
        break;
      case 3:
        var longWaitingRecord = parseLongWaitingRecords(sections[i].data, periodId, startDatetime);
        longWaitingRecords = longWaitingRecords.concat(longWaitingRecord);
        break;
      case 4:
        var overSpeedRecord = parseOverSpeedRecords(sections[i].data, periodId, startDatetime);
        overSpeedRecords = overSpeedRecords.concat(overSpeedRecord);
        break;
    }
  }

  console.log('-------------COMPREHENSIVE OPERATION RECORDS-------------');
  console.log(operationRecords);

  console.log('\n\n\n-------------ANALYSIS OF HIRED DETAILS-------------');
  console.log(hiredRecords);

  console.log('\n\n\n-------------ANALYSIS OF ENGINE OPERATION-------------');
  console.log(engineOperationRecords);

  console.log('\n\n\n-------------ANALYSIS OF LONG WAITINGS-------------');
  console.log(longWaitingRecords);

  console.log('\n\n\n-------------ANALYSIS OF OVER SPEEDS-------------');
  console.log(overSpeedRecords);
}

function parseOperationRecords(text, periodId) {
  var date = S(text).between('COMPREHENSIVE OPERATION RECORDS (Date : ', ' DAY)').s;
  var taxiNumber = S(text).between('Taxi:', ' Driver').s;
  var startTime = S(text).between('Start:', ' End:').s;
  var endTime = S(text).between('End:', ' O/P:').s;

  var amountPerKm = S(text).between('Amount/Km : ', ' T/Hours : ').s;
  var hiredRate = S(text).between('Hired Rate: ', '%').s;
  var getOnRate = S(text).between('Get on % : ', '%').s;
  if(isNaN(parseFloat(getOnRate))) {
    // Data hired details tidak ada, sehingga format get on rate berubah
    getOnRate = S(text).between('Get on %% : ', '%').s;
  }
  return {
    taxi_id       : taxiNumber,
    period_id     : periodId,
    start_datetime: startTime,
    end_datetime  : endTime,
    amount_per_km : amountPerKm,
    hired_rate    : hiredRate,
    get_on_rate   : getOnRate
  };
}

function parseHiredRecords(text, periodId, start) {
  var startDatetime = new Date(start);
  var recordsText = S(text).between('No. Empty(Km) Get On-Off Paid(Km) Amount D. No. Empty(Km) Get On-Off Paid(Km) Amount D. ', ' --').s;

  var records = [];
  var values = recordsText.split(' ');
  for(var i=0; i<values.length; i=i+6) {
    var result = parseHiredRecord(values.slice(i, i+6), periodId, startDatetime);
    records.push(result.record);
    startDatetime = result.time;
  }

  var lastEmptyDistance = S(text).between('-- ', ' ').s;
  var record = {
    transaction_id  : '',
    period_id       : periodId,
    empty_distance  : lastEmptyDistance,
    get_on_datetime : datetimeToString(startDatetime),
    get_off_datetime: datetimeToString(startDatetime)
  };

  records.push(record);
  return records;
}

function parseHiredRecord(values, periodId, baseTime) {
  // Parse get on time
  var stripeIndex = values[2].indexOf('-');
  var getOnTime = S(values[2]).between('.', '-').s;
  if(getOnTime != '') {
    var date = values[2].slice(0, values[2].indexOf('.'));
    baseTime.setDate(date);
  } else {
    getOnTime = values[2].slice(0, stripeIndex);
  }
  var hour = getHour(getOnTime);
  var minute = getMinute(getOnTime);
  var getOnDatetime = new Date(baseTime.getTime());
  getOnDatetime.setHours(hour);
  getOnDatetime.setMinutes(minute);

  // Parse get off time
  var getOffTime = values[2].slice(stripeIndex+1, values[2].length);
  hour = getHour(getOffTime);
  minute = getMinute(getOffTime);
  var getOffDatetime = new Date(baseTime.getTime());
  getOffDatetime.setHours(hour);
  getOffDatetime.setMinutes(minute);

  return {
    record: {
      transaction_id  : values[0],
      period_id       : periodId,
      empty_distance  : values[1],
      get_on_datetime : datetimeToString(getOnDatetime),
      get_off_datetime: datetimeToString(getOffDatetime),
      paid_distance   : values[3],
      amount          : values[4]
    }, 
    time: baseTime
  };
}

function getHour(str) {
  return str.slice(0, str.indexOf(':'));
}

function getMinute(str) {
  return str.slice(str.indexOf(':')+1, str.length);
}

function parseEngineOperationRecords(text, periodId, start) {
  var startDatetime = new Date(start);
  var recordsText = S(text).between('No. Stop-Start Time No. Stop-Start Time No. Stop-Start Time No. Stop-Start Time ', ' Tot.').s;
  
  var records = [];
  var values = recordsText.split(' ');
  for(var i=0; i<values.length; i=i+3) {
    var result = parseEngineOperationRecord(values.slice(i, i+3), periodId, startDatetime);
    records.push(result.record);
    startDatetime = result.time;
  }

  return records;
}

function parseEngineOperationRecord(values, periodId, baseTime) {
  // Parse get on time
  var stripeIndex = values[1].indexOf('-');
  var getOnTime = S(values[1]).between('.', '-').s;
  if(getOnTime != '') {
    var date = values[1].slice(0, values[1].indexOf('.'));
    baseTime.setDate(date);
  } else {
    getOnTime = values[1].slice(0, stripeIndex);
  }
  var hour = getHour(getOnTime);
  var minute = getMinute(getOnTime);
  var getOnDatetime = new Date(baseTime.getTime());
  getOnDatetime.setHours(hour);
  getOnDatetime.setMinutes(minute);

  // Parse get off time
  var getOffTime = values[1].slice(stripeIndex+1, values[1].length);
  hour = getHour(getOffTime);
  minute = getMinute(getOffTime);
  var getOffDatetime = new Date(baseTime.getTime());
  getOffDatetime.setHours(hour);
  getOffDatetime.setMinutes(minute);

  return {
    record: {
      engine_op_id    : values[0],
      period_id       : periodId,
      get_on_datetime : datetimeToString(getOnDatetime),
      get_off_datetime: datetimeToString(getOffDatetime),
      duration        : values[2],
    }, 
    time: baseTime
  };
}

function parseLongWaitingRecords(text, periodId, start) {
  var startDatetime = new Date(start);
  var recordsText = S(text).between('No. Get Off-On Time Dist. No. Get Off-On Time Dist. No. Get Off-On Time Dist. ', ' Tot.').s;

  var records = [];
  var values = recordsText.split(' ');
  for(var i=0; i<values.length; i=i+4) {
    var result = parseLongWaitingRecord(values.slice(i, i+4), periodId, startDatetime);
    records.push(result.record);
    startDatetime = result.time;
  }

  return records;
}

function parseLongWaitingRecord(values, periodId, baseTime) {
  // Parse get on time
  var stripeIndex = values[1].indexOf('-');
  var getOffTime = S(values[1]).between('.', '-').s;
  if(getOffTime != '') {
    var date = values[1].slice(0, values[1].indexOf('.'));
    baseTime.setDate(date);
  } else {
    getOffTime = values[1].slice(0, stripeIndex);
  }
  var hour = getHour(getOffTime);
  var minute = getMinute(getOffTime);
  var getOffDatetime = new Date(baseTime.getTime());
  getOffDatetime.setHours(hour);
  getOffDatetime.setMinutes(minute);

  // Parse get off time
  var getOnTime = values[1].slice(stripeIndex+1, values[1].length);
  hour = getHour(getOnTime);
  minute = getMinute(getOnTime);
  var getOnDatetime = new Date(baseTime.getTime());
  getOnDatetime.setHours(hour);
  getOnDatetime.setMinutes(minute);

  return {
    record: {
      long_waiting_id : values[0],
      period_id       : periodId,
      get_off_datetime: datetimeToString(getOffDatetime),
      get_on_datetime : datetimeToString(getOnDatetime),
      duration        : values[2],
      distance        : values[3]
    }, 
    time: baseTime
  };
}

function parseOverSpeedRecords(text, periodId, start) {
  var startDatetime = new Date(start);
  var recordsText = text.replace('ANALYSIS OF OVER SPEEDS No. Time km/h No. Time km/h No. Time km/h No. Time km/h No. Time km/h No. Time km/h ', '');
  recordsText = recordsText.substring(0, recordsText.lastIndexOf(' ')); // Handle space in the end

  var records = [];
  var values = recordsText.split(' ');
  for(var i=0; i<values.length; i=i+3) {
    if(values[i].match(/^[A-Za-z\s]+$/)) {
      return records;
    } else {
      var result = parseOverSpeedRecord(values.slice(i, i+3), periodId, startDatetime);
      records.push(result.record);
      startDatetime = result.time;
    }
  }

  return records;
}

function parseOverSpeedRecord(values, periodId, baseTime) {
  // Parse time
  var datetime = new Date(baseTime.getTime());
  var time = values[1];
  var dotIndex = time.indexOf('.');
  if(dotIndex != -1) {
    // Get date
    var date = time.substring(0, dotIndex);
    datetime.setDate(date);
    time = time.substring(dotIndex+1, time.length);
  }
  var hour = getHour(time);
  var minute = getMinute(time);
  datetime.setHours(hour);
  datetime.setMinutes(minute);

  return {
    record: {
      over_speed_id: values[0],
      period_id    : periodId,
      datetime     : datetimeToString(datetime),
      speed        : values[2],
    }, 
    time: datetime
  };
}

function datetimeToString(date) {
    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();
    var h = date.getHours();
    var mi = date.getMinutes();
    return '' + y + '-' + (m<=9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d) + ' ' + (h <= 9 ? '0' + h : h) + ':' + (mi <= 9 ? '0' + mi : mi);
}

// Number.prototype.padLeft = function(base,chr){
//   var  len = (String(base || 10).length - String(this).length)+1;
//   return len > 0? new Array(len).join(chr || '0')+this : this;
// }

// function datetimeToString(date) {
//   dformat = [(date.getMonth()+1).padLeft(),
//              date.getDate().padLeft(),
//              date.getFullYear()].join('/') +' ' +
//             [date.getHours().padLeft(),
//              date.getMinutes().padLeft(),
//              date.getSeconds().padLeft()].join(':');
//   return dformat;
// }
