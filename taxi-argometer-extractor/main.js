var S = require('string');
var fs = require('fs');
var textract = require('textract');

main();
// var config = {pdftotextOptions: {layout: 'raw'}};
// var filePath = 'source_data/12/20 12.pdf';
// parseExractFiles(filePath, config);

function main() {
  var config = {pdftotextOptions: {layout: 'raw'}};
  var filenames = [
    {dir: '7', files: ['9', '10', '11', '12']},
    {dir: '8', files: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '27', '29', '30', '31']},
    {dir: '9', files: ['1', '2', '3', '4', '5', '6', '7', '28']},
    {dir: '10', files: ['1', '2', '3', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31']},
    {dir: '11', files: ['1', '2', '4', '6', '7', '8', '9', '10', '11', '12', '13', '15', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30']},
    {dir: '12', files: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '15', '16', '17', '18', '19', '20', '21', '23', '24', '25', '26', '27', '28', '29', '30']}
  ];

  for(var i=0; i<filenames.length; i++) {
    var dir = filenames[i].dir;
    var files = filenames[i].files;
    for(var j=0; j<files.length; j++) {
      var filePath = 'source_data/' + dir + '/' + files[j] + ' ' + dir + '.pdf';
      parseExractFiles(filePath, config);
    }
  }
}

function parseExractFiles(filePath, config) {
  var status = textract.fromFileWithPath(filePath, config, function(error, text) {
    if(error != null) {
      console.log(error);
    } else {
      console.log('Extracted ' + filePath + ' ' + text.length);
      var records = parseText(text);
      convertToCSV(records);
    }
  });
}

function convertToCSV(records) {
  // console.log('-------------COMPREHENSIVE OPERATION RECORDS-------------');
  var operationJson = JSON.stringify(records.operation);

  // console.log('\n\n\n-------------ANALYSIS OF HIRED DETAILS-------------');
  var hiredJson = JSON.stringify(records.hired);

  // console.log('\n\n\n-------------ANALYSIS OF ENGINE OPERATION-------------');
  var engineOperationJson = JSON.stringify(records.engine_operation);

  // console.log('\n\n\n-------------ANALYSIS OF LONG WAITINGS-------------');
  var longWaitingJson = JSON.stringify(records.long_waiting);

  // console.log('\n\n\n-------------ANALYSIS OF OVER SPEEDS-------------');
  var overSpeedJson = JSON.stringify(records.over_speed);

  saveToFile('operation.csv', jsonToCSV(operationJson));
  saveToFile('transaction.csv', jsonToCSV(hiredJson));
  saveToFile('engine_operation.csv', jsonToCSV(engineOperationJson));
  saveToFile('long_waiting.csv', jsonToCSV(longWaitingJson));
  saveToFile('over_speed.csv', jsonToCSV(overSpeedJson));
}

function saveToFile(filename, text) {
  var filePath = __dirname + '/csv/' + filename;

  fs.appendFileSync(filePath, text);
  console.log("File " + filename + ' has been saved.');
}

function jsonToCSV(objArray) {
  var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
  var str = '';

  for (var i = 0; i < array.length; i++) {
      var line = '';
      for (var index in array[i]) {
          if (line != '') line += ','

          line += array[i][index];
      }

      str += line + '\r\n';
  }

  return str;
}

function parseText(text) {
  var titles = ['COMPREHENSIVE OPERATION RECORDS', 'ANALYSIS OF HIRED DETAILS', 'ANALYSIS OF ENGINE OPERATION', 'ANALYSIS OF LONG WAITINGS', 'ANALYSIS OF OVER SPEEDS'];

  var indices = getSectionIndices(text, titles);
  indices.sort(compareIndex);
  sections = getSectionData(text, indices);

  return parseSectionData(sections);
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
  var isOperationNull = false;
  for(var i=0; i<sections.length; i++) {
    switch(sections[i].title) {
      case 0:
        periodId++;
        var operationRecord = parseOperationRecords(sections[i].data, periodId);
        if(operationRecord) {
          isOperationNull = false;
          startDatetime = operationRecord.start_datetime;
          operationRecords = operationRecords.concat(operationRecord);
        } else {
          isOperationNull = true;
        }
        break;
      case 1:
        if(!isOperationNull) {
          var hiredRecord = parseHiredRecords(sections[i].data, periodId, startDatetime);
          hiredRecords = hiredRecords.concat(hiredRecord);
        }
        break;
      case 2:
        if(!isOperationNull) {
          var engineOperationRecord = parseEngineOperationRecords(sections[i].data, periodId, startDatetime);
          engineOperationRecords = engineOperationRecords.concat(engineOperationRecord);
        }
        break;
      case 3:
        if(!isOperationNull) {
          var longWaitingRecord = parseLongWaitingRecords(sections[i].data, periodId, startDatetime);
          longWaitingRecords = longWaitingRecords.concat(longWaitingRecord);
        }
        break;
      case 4:
        if(!isOperationNull) {
          var overSpeedRecord = parseOverSpeedRecords(sections[i].data, periodId, startDatetime);
          overSpeedRecords = overSpeedRecords.concat(overSpeedRecord);
        }
        break;
    }
  }

  return {
    operation       : operationRecords,
    hired           : hiredRecords,
    engine_operation: engineOperationRecords,
    long_waiting    : longWaitingRecords,
    over_speed      : overSpeedRecords
  };
}

function parseOperationRecords(text, periodId) {
  var taxiNumbers = ['717','718','719','720','721','722','723','724','725','726','727','728','729','730','731','732','733','734','735','736','737','738','739','740','741','742','743','744','745','746','747','748','749','750','751','752','753','754','755','756','757','758','759','760','761','762','763','764','765','766','767','768','769','770','771','772','773','774','775','776','777','778','779','780','781','782','783','784','785','786','787','788','789','790','801','802','803','804','805','806','807','808','809','810','811','812','813','814','815','816','817','818','819','820','821','822','823','824','825','826','827','828','829','830','831','832','833','834','835','836','837','838','839','840','841','842','843','844','845','846','847','848','849','850','851','852','853','854','855','856','857','858','859','860','861','862','863','864','865','866','867','868','869','870','871','872','873','874','875','876'];

  var date = S(text).between('COMPREHENSIVE OPERATION RECORDS (Date : ', ' DAY)').s;
  var taxiNumber = S(text).between('Taxi:00-0', ' Driver').s;
  var startTime = S(text).between('Start:', ' End:').s;
  var endTime = S(text).between('End:', ' O/P:').s;

  // Check taxi existence
  if (taxiNumbers.indexOf(taxiNumber) == -1) {
    return null;
  }

  // Compare date
  var startDatetime = new Date(startTime);
  var stopDatetime = new Date(endTime);
  if(startDatetime > stopDatetime) {
    return null;
  }

  var amountPerKm = S(text).between('Amount/Km : ', ' T/Hours : ').s;
  var hiredRate = S(text).between('Hired Rate: ', '%').s;
  var getOnRate = S(text).between('Get on % : ', '%').s;
  if(isNaN(parseFloat(getOnRate))) {
    // Data hired details tidak ada, sehingga format get on rate berubah
    getOnRate = S(text).between('Get on %% : ', '%').s;
  }
  if(hiredRate == '**.**') {
    hiredRate = '-999';
  }
  if(amountPerKm == '***') {
    amountPerKm = '-999';
  }
  if(getOnRate == '**.**'){
    getOnRate = '-999';
  }

  return {
    taxi_id       : taxiNumber,
    period_id     : periodId,
    start_datetime: startTime,
    end_datetime  : endTime,
    amount_per_km : amountPerKm.replace(',', ''),
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
    if(i+6 < values.length) {
      var result = parseHiredRecord(values.slice(i, i+6), periodId, startDatetime);
      if(result) {
        records.push(result.record);
        startDatetime = result.time;
      }
    }
  }

  var lastEmptyDistance = S(text).between('-- ', ' ').s;
  var record = {
    period_id       : periodId,
    transaction_id  : '0',
    empty_distance  : lastEmptyDistance,
    get_on_datetime : datetimeToString(startDatetime),
    get_off_datetime: datetimeToString(startDatetime),
    paid_distance   : '',
    amount          : ''
  };

  records.push(record);
  return records;
}

function parseHiredRecord(values, periodId, baseTime) {
  // Parse get on time
  var stripeIndex = values[2].indexOf('-');
  var dotIndex = values[2].indexOf('.');
  var getOnTime = S(values[2]).between('.', '-').s;
  if(dotIndex != -1) {
    var date = values[2].slice(0, values[2].indexOf('.'));
    baseTime.setDate(date);
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

  // Check get on and get off time
  if(getOnDatetime.getTime() === getOffDatetime.getTime()) {
    return null;
  }

  return {
    record: {
      period_id       : periodId,
      transaction_id  : values[0],
      empty_distance  : values[1],
      get_on_datetime : datetimeToString(getOnDatetime),
      get_off_datetime: datetimeToString(getOffDatetime),
      paid_distance   : values[3],
      amount          : values[4].replace(',', '')
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
    if(i+3 < values.length) {
      var result = parseEngineOperationRecord(values.slice(i, i+3), periodId, startDatetime);
      if(result) {
        records.push(result.record);
        startDatetime = result.time;
      }
    }
  }

  return records;
}

function parseEngineOperationRecord(values, periodId, baseTime) {
  // Parse get on time
  var stripeIndex = values[1].indexOf('-');
  var dotIndex = values[2].indexOf('.');
  var getOnTime = S(values[1]).between('.', '-').s;
  if(dotIndex != -1) {
    var date = values[1].slice(0, values[1].indexOf('.'));
    baseTime.setDate(date);
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

  if(isNaN(getOffDatetime.getTime()) || isNaN(getOnDatetime.getTime())) {
    return null;
  }

  return {
    record: {
      period_id       : periodId,
      engine_op_id    : values[0],
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
    if(i+4 < values.length) {
      var result = parseLongWaitingRecord(values.slice(i, i+4), periodId, startDatetime);
      if(result) {
        records.push(result.record);
        startDatetime = result.time;
      }
    }
  }

  return records;
}

function parseLongWaitingRecord(values, periodId, baseTime) {
  // Parse get on time
  var stripeIndex = values[1].indexOf('-');
  var dotIndex = values[2].indexOf('.');
  var getOffTime = S(values[1]).between('.', '-').s;
  if(dotIndex != -1) {
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

  if(isNaN(getOffDatetime.getTime()) || isNaN(getOnDatetime.getTime())) {
    return null;
  }

  return {
    record: {
      period_id       : periodId,
      long_waiting_id : values[0],
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
      if(i+3 < values.length) {
        var result = parseOverSpeedRecord(values.slice(i, i+3), periodId, startDatetime);
        records.push(result.record);
        startDatetime = result.time;
      }
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
      period_id    : periodId,
      over_speed_id: values[0],
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
