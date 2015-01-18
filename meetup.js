var http = require('http');
var request = require('request');
var async = require('async');
var moment = require('moment');

var STATUS_OK = "ok";
var STATUS_EDIT = "edit";
var STATUS_ERROR = "error";

var meetup = function(config) {

  if(!config || !config.meetup.apikey || !config.meetup.groupurl || !config.meetup.groupid) {
      // We should do something
      throw new Error("Missing configuration");
  }

  // Gets an array of talks and returns a formatted Meetup
  // Event description
  var _getFormattedDescription = function(talks){
    var description = "";

    talks.forEach(function(talk){
      description += '<a href="http://twitter.com/'+ talk.speaker.twitter +'">' + talk.speaker.name.toUpperCase() + '</a>';
      description += '<br/><br/>';
      description += 'LANGUAGE: ' + talk.language.toUpperCase() + ' | LEVEL: ' + talk.level.toUpperCase();
      description += '<br/><br/>';
      description += '<strong>'+ talk.title +'</strong>';
      description += '<br/><br/>';
      description += '<p>'+ talk.description +'</p>';
    });

    return description;
  }


  return {
    trigger :function(talks, cb) {

      if(!talks) {
        // we should do something as well
      }

      var meetupApiKey = config.meetup.apikey;
      var meetupGroupId = config.meetup.groupid;
      var meetupGroupUrl = config.meetup.groupurl;

      // Get the group ID
      var eventsUrl = "https://api.meetup.com/2/events?sign=true&key=" + meetupApiKey + "&group_id=" + meetupGroupId;
      var createEventUrl = "https://api.meetup.com/2/event?sign=true&key=" + meetupApiKey;

      async.waterfall([
        // Check if the event related to the talk already exists in meetup
        function(callback) {
          // Get all the group meetup events
          request(eventsUrl, function (error, response, body) {
            if (!error && response.statusCode == 200) {

              var meetupEvents = JSON.parse(body).results;

              // Check if on of the meetup events matches the event related to the talks
              var matchingEvent = meetupEvents.filter(function(meetupEvent){
                return meetupEvent.name.toLowerCase() === talks.event.name.toLowerCase();
              }); 
              callback(null, matchingEvent);

            } else {
              callback(error, null);
            }
          });
        },
        function(matchingEvent, callback) {
          // If the event does not already exist
          if(matchingEvent.length == 0) {
            
            // We need to create it
            var formData = {
              "group_id": meetupGroupId, 
              "group_url": meetupGroupUrl, 
              "name": talks.event.name, 
              "description": _getFormattedDescription(talks.talks),
              "time": moment(talks.event.date).format('x') // we need to setup a date as a unix ms timestamp or the
                                                            // event won't be included in the list of existing events
            };

            // TODO : Handle venue, and other event details.

            request.post(createEventUrl, {form:formData}, function(err, response, body){
              if(! err && response.statusCode == 200) {
                // Event successfully created
                callback(null, STATUS_OK);
              } else {
                callback(err, null);
              }
            });
          } else {
            // we need to update the event
            callback(null, STATUS_EDIT);
          }
        },
        function(status, callback) {
          // If we need to update an existing event.
          
        }

      ], function(err, result){
          cb(err, result);
      });

     
    }
  }
};
  
exports = module.exports = meetup;