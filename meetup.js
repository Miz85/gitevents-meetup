var http = require('http');
var request = require('request');
var async = require('async');

var meetup = function(config) {

  // if(!config || !config.meetup.apikey) {
  //     // We should do something
  // }


  this.trigger = function(talks, callback) {

    if(!talks) {
      // we should do something as well
    }

    var meetupApiKey = config.meetup.apikey;
    var meetupGroupId = config.meetup.groupid;

    // Get the group ID 
    console.log(meetupApiKey);
    console.log(meetupGroupId);

    //  // Get the group ID
    // request('https://api.meetup.com/' + meetupGroupUrl + '?sign=true&key=' + meetupApiKey, function (error, response, body) {
    //   if (!error && response.statusCode == 200) {
    //    // console.log(JSON.parse(body).id);
    //     callback(null, body);
    //   } else {
    //     throw error;

    //   }

    //});

     callback(null, {"status": "ok"});

  };

  return this;

};
  
exports = module.exports = meetup;