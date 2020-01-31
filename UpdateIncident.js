var request = require("request");
const conf = {
    url: process.env.url,
    key: process.env.key
  }
module.exports = {
//Update(37, 4, "Fixed")
Update : function (id, status, message) {
    var options = {
        method: 'POST',
        headers: {
            'X-Cachet-Token': conf.KEY
        },
        url: conf.URL + 'api/v1/incidents/' + id + '/updates',
        body: {
            status: status,
            message: message,
            user_id: 1
        },
        json: true
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        console.log(body);
    });
}
}