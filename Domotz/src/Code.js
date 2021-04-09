var cc = DataStudioApp.createCommunityConnector();

function getConfig (request) {
}

function getFields () {
    var cc = DataStudioApp.createCommunityConnector();
    var fields = cc.getFields();
    var types = cc.FieldType;
    fields
        .newDimension()
        .setId('agentname')
        .setName('AgentName')
        .setDescription('AgentName')
        .setType(types.TEXT);
    fields
        .newDimension()
        .setId('coordinates')
        .setName('Coordinates')
        .setDescription('Coordinates')
        .setType(types.LATITUDE_LONGITUDE);
    return fields;
}

function getSchema (request) {
    return {schema: getFields().build()};
}

function getData (request) {
    var requestedFieldIds = request.fields.map(function (field) {
        return field.name;
    });
    var requestedFields = getFields().forIds(requestedFieldIds);

    var userProperties = PropertiesService.getUserProperties();
    var key = userProperties.getProperty('dscc.key');
    var url = userProperties.getProperty('dscc.url');
    console.log('URL is ' + url);
    var requestOptions = {
        muteHttpExceptions: true,
        headers: {
            'X-API-KEY': key,
        },
    };

    var columns;
    response = UrlFetchApp.fetch(url + 'agent', requestOptions);
    if (response.getResponseCode() === 200) {
        var response = JSON.parse(response.getContentText());
        columns = response.map(function (agent) {
            var rowValues = [];
            requestedFields.asArray().forEach(function (field) {
                switch (field.getId()) {
                    case 'agentname':
                        rowValues.push(agent.display_name);
                        break;
                    case 'coordinates':
                        rowValues.push(agent.location.latitude + ", " + agent.location.longitude);
                        break;
                }
            });
            return {values: rowValues};
        });

        return {
            schema: requestedFields.build(),
            rows: columns
        };
    } else {
        //raise error
    }
}

function getAuthType () {
    var AuthTypes = cc.AuthType;
    return cc
        .newAuthTypeResponse()
        .setAuthType(AuthTypes.KEY)
        .build();
}

var urlEU = 'https://api-eu-west-1-cell-1.domotz.com/public-api/v1/';
var urlUS = 'https://api-us-east-1-cell-1.domotz.com/public-api/v1/';

function validateKey (key) {
    console.log('validateKey');
    if (!key) {
        console.log(1);
        return false;
    }
    var requestOptions = {
        muteHttpExceptions: true,
        headers: {
            'X-API-KEY': key,
        },
    };
    var authEU = urlEU + 'user';
    var authUS = urlUS + 'user';

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

function isAuthValid () {
    var userProperties = PropertiesService.getUserProperties();
    var key = userProperties.getProperty('dscc.key');

    return Boolean(validateKey(key));
}

function resetAuth () {
    console.log('resetAuth');
    var userProperties = PropertiesService.getUserProperties();
    userProperties.deleteProperty('dscc.key');
}

function setCredentials (request) {
    console.log('setCredentials');
    var invalid_credentials = {
        errorCode: 'INVALID_CREDENTIALS',
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
    userProperties.setProperty('dscc.key', key);
    userProperties.setProperty('dscc.url', baseURL);
    return {
        errorCode: 'NONE',
    };
}

function isAdminUser () {
    return true;
}
