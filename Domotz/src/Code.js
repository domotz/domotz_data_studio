var cc = DataStudioApp.createCommunityConnector();

function getConfig(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var config = cc.getConfig();

  config
    .newTextInput()
    .setId("exampleTextInput")
    .setName("Single line text")
    .setHelpText("Helper text for single line text")
    .setPlaceholder("Lorem Ipsum");
  config.setIsSteppedConfig(false);
  return config.build();
}

function getSchema(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var fields = cc.getFields();
  var types = cc.FieldType;
  fields
    .newDimension()
    .setId("Username")
    .setName("Username")
    .setDescription("Username")
    .setType(types.TEXT);

  return { schema: fields.build() };
}

function getData(request) {
  var userProperties = PropertiesService.getUserProperties();
  var key = userProperties.getProperty("dscc.key");
  var url = userProperties.getProperty("dscc.url");
  console.log("URL is " + url);
  var requestOptions = {
    muteHttpExceptions: true,
    headers: {
      "X-API-KEY": key
    }
  };
  var schema = {
    schema: [
      {
        name: "Username",
        dataType: "STRING"
      }
    ],
    rows: [
      {
        values: []
      }
    ],
    filtersApplied: false
  };

  var response;

  response = UrlFetchApp.fetch(url + "user", requestOptions);
  if (response.getResponseCode() === 200) {
    var data = JSON.parse(response.getContentText());
    schema.rows[0].values.push(data.name);
  }

  return schema;
}

function getAuthType() {
  var AuthTypes = cc.AuthType;
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.KEY)
    .build();
}

var urlEU = "https://api-eu-west-1-cell-1.domotz.com/public-api/v1/";
var urlUS = "https://api-us-east-1-cell-1.domotz.com/public-api/v1/";

function validateKey(key) {
  console.log("validateKey");
  if (!key) {
    console.log(1);
    return false;
  }
  var requestOptions = {
    muteHttpExceptions: true,
    headers: {
      "X-API-KEY": key
    }
  };
  var authEU = urlEU + "user";
  var authUS = urlUS + "user";

  var response;

  response = UrlFetchApp.fetch(authEU, requestOptions);

  if (response.getResponseCode() === 200) {
    return urlEU;
  }

  response = UrlFetchApp.fetch(authUS, requestOptions);

  if (response.getResponseCode() === 200) {
    return urlUS;
  }
  return false;
}

function isAuthValid() {
  var userProperties = PropertiesService.getUserProperties();
  var key = userProperties.getProperty("dscc.key");

  return Boolean(validateKey(key));
}

function resetAuth() {
  console.log("resetAuth");
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty("dscc.key");
}

function setCredentials(request) {
  console.log("setCredentials");
  var invalid_credentials = {
    errorCode: "INVALID_CREDENTIALS"
  };
  if (!request || !request.key) {
    return invalid_credentials;
  }
  var key = request.key;

  var baseURL = validateKey(key);
  if (!baseURL) {
    return invalid_credentials;
  }
  var userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty("dscc.key", key);
  userProperties.setProperty("dscc.url", baseURL);
  return {
    errorCode: "NONE"
  };
}

function isAdminUser() {
  return true;
}
