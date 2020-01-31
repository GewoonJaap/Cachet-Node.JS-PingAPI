var request = require("request");
const conf = {
  url: process.env.URL,
  key: process.env.KEY
};
module.exports = {
  //Update(37, 4, "Fixed")
  Update: function(id, status, message) {
    var options = {
      method: "POST",
      headers: {
        "X-Cachet-Token": conf.key
      },
      url: conf.url + "/api/v1/incidents/" + id + "/updates",
      body: {
        status: status,
        message: message,
        user_id: 1
      },
      json: true
    };

    request(options, function(error, response, body) {
      if (error) console.log(error);

      console.log(body);
    });
  }
};
