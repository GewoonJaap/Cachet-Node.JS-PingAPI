// server.js
// where your node app starts

// init project
const fs = require("fs");
const servers = JSON.parse(fs.readFileSync("./servers.json"));
const express = require("express");
const app = express();
var CachetAPI = require("cachet-api");
var tcpp = require("tcp-ping");
var UpdateIncident = require("./UpdateIncident.js");
const conf = {
  url: process.env.URL,
  key: process.env.KEY
};
var cachet = new CachetAPI({
  // Base URL of your installed Cachet status page
  url: conf.url,
  // Cachet API key (provided within the admin dashboard)
  apiKey: conf.key
});
UpdatePing();
let interval = setInterval(UpdatePing, 60000);

function UpdatePing() {
  for (let i = 0; i < servers.length; i++) {
    Ping(i);
  }
}
//
///Ping server and change status when needed
//
function Ping(index) {
  try {
    //
    ///Check if server is online!
    //
    tcpp.probe(servers[index].ip, servers[index].port, function(
      err,
      available
    ) {
      console.log(available);
      if (available) {
        //
        ///Server is online! Check the AVG. ping
        //
        tcpp.ping(
          {
            address: servers[index].ip,
            port: servers[index].port
          },
          function(err, data) {
            // console.log(err);
            // console.log(data);
            let jsondata = JSON.parse(JSON.stringify(data));
            //Add to Cachet
            var metricPoint = {
              // Metric ID
              id: servers[index].id,
              // Metric point value
              value: data.avg,
              // Metric point timestamp (optional, defaults to now)
              timestamp: Math.round(new Date().getTime() / 1000) + 3600
            };

            // Publish it so it shows up on the status page
            cachet
              .publishMetricPoint(metricPoint)
              .then(function(response) {
                // Log API response
                console.log(
                  "Metric point published at " + response.data.created_at
                );
              })
              .catch(function(err) {
                // Log errors to console
                console.log("Fatal Error", err);
              });
          }
        );
        //
        ///Server is back online. Resolve cachet issue!
        //
        if (!servers[index].online) {
          UpdateIncident.Update(
            servers[index].incidentid,
            4,
            "It looks like the issues have been resolved! We will continue to monitor the service!"
          );
          servers[index].online = true;
          servers[index].incidentid = 0;
          let data = JSON.stringify(servers, null, 4);
          fs.writeFileSync("./servers.json", data);
        }
      } else {
        //
        ///Server has gone offline! Add issue to cachet!
        //
        if (servers[index].online) {
          var incident = {
            // Incident name
            name: servers[index].name + " connectivity issues",
            // Incident description (supports markdown)
            message:
              "We're investigating connectivity issues with the " +
              servers[index].name +
              " server.",
            // Incident status (https://docs.cachethq.io/docs/incident-statuses)
            status: "Investigating",
            // Whether the incident will be visible to the public or only to logged in users
            visible: true,
            // Whether to send out e-mail notifications to subscribers regarding this incident
            notify: true,
            // Component ID affected by this incident (optional)
            component_id: servers[index].id,
            // Component status (required if component_id is specified) (https://docs.cachethq.io/docs/component-statuses)
            component_status: "Partial Outage"
          };

          // Report it so it shows up on the status page
          cachet
            .reportIncident(incident)
            .then(function(response) {
              // Log API response
              let json = JSON.parse(JSON.stringify(response));
              console.log(
                "New incident reported at " + response.data.created_at
              );
              //
              ///Incident made, save the incidentid to the file!
              //
              servers[index].online = false;
              servers[index].incidentid = json.data.id;
              let data = JSON.stringify(servers, null, 4);
              fs.writeFileSync("./servers.json", data);
            })
            .catch(function(err) {
              // Log errors to console
              console.log("Fatal Error", err);
            });
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
}

//
///Some unneeded stuffs :P
//

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
