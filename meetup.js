var http = require('http');
var request = require('request');
var async = require('async');
var moment = require('moment');

var STATUS_OK = "ok";

var meetup = function(config) {

  // Check if the configuration is there
  if(!config || !config.meetup.apikey || !config.meetup.groupurl || !config.meetup.groupid) {
      // We should do something
      throw new Error("Missing configuration");
  }

  // Configuration options
  var _meetupApiKey = config.meetup.apikey;
  var _meetupGroupId = config.meetup.groupid;
  var _meetupGroupUrl = config.meetup.groupurl;

  
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

  // Returns a venue ID to use in the event.
  // 1/ Will try to find a matching venue in those previously
  //    used by the meetup group
  // 2/ If no group venue matches will try to find an open venue that matches
  // 3/ If no open venue matches, will create one and use it 
  var _getVenueId = function(venue, cb){
    // Preparing the API calls
    var _openVenuesUrl = "http://api.meetup.com/2/open_venues?sign=true&key=" + 
                          _meetupApiKey + "&country=ES&city=barcelona&order=rating&desc=true&text=" + venue.name;
    var _venuesUrl = "https://api.meetup.com/" + _meetupGroupUrl + "/venues?sign=true&key=" + _meetupApiKey;

    // Get the list of venues previously used by the group
     request(_venuesUrl, function (err, response, body){
        if(!err && response.statusCode == 200){
          var venues = JSON.parse(body);

          // If the venue exists
          var matchingGroupVenue = venues.filter(function(venue){
            return venue.name === talks.event.venue.name;
          });

          // If no venue matched
          if(matchingGroupVenue.length == 0) {
                // No matching Venue so we need to create it.
                var venueCreationData = {
                  "address_1": venue.address,
                  "city": "Barcelona",
                  "country": "ES",
                  "name": venue.name
                };

                request.post(_venuesUrl, {form:venueCreationData}, function(err, response, body){
                  if(!err && response.statusCode == 200 || response.statusCode == 201){
                    var venue = JSON.parse(body);
                    cb(null, venue.id);
                  }
                });  


          } else {
            cb(null, matchingGroupVenue[0].id); 
          }
        }
      });
  };

  // Creates or update a meetup event
  // Based on the event date specified in the talks object.
  var _createOrUpdateEvent = function(venueId, talks, cb){
    // Events Meetup API Calls
    var _eventsUrl = "https://api.meetup.com/2/events?sign=true&key=" + _meetupApiKey + "&group_id=" + _meetupGroupId;
    var _createEventUrl = "https://api.meetup.com/2/event?sign=true&key=" + _meetupApiKey;

  
    // Get all the group meetup events
    request(_eventsUrl, function (error, response, body) {
      if (!error && response.statusCode == 200) {

        var meetupEvents = JSON.parse(body).results;

        // Check if on of the meetup events matches the event related to the talks
        var matchingEvent = meetupEvents.filter(function(meetupEvent){
          return moment(meetupEvent.time).utc().format('x') == moment(talks.event.date).utc().format('x');
        }); 

        // If the event does not already exist
        if(matchingEvent.length == 0) {
          
          // Prepare the data needed to create the event
          var eventCreationData = {
            "group_id": _meetupGroupId, 
            "group_url": _meetupGroupUrl, 
            "name": talks.event.name, 
            "description": _getFormattedDescription(talks.event.talks),
            "venue_id": venueId,
            "time": moment(talks.event.date).utc().format('x') // we need to setup a date as a unix ms timestamp or the
                                                          // event won't be included in the list of existing events
          };

          // 
          request.post(_createEventUrl, {form:eventCreationData}, function(err, response, body){
            if(! err && response.statusCode == 200) {
              // Event successfully created
              cb(null, STATUS_OK);
            } else {
              cb(err, null);
            }
          });
        } else {
          // we need to update the event
          var eventUpdateData = {
            "group_id": _meetupGroupId,
            "name": talks.event.name, 
            "description": _getFormattedDescription(talks.event.talks),
            "venue_id": venueId,
            "time": moment(talks.event.date).utc().format('x') // we need to setup a date as a unix ms timestamp or the
                                                          // event won't be included in the list of existing events
          };

          // Prepare the API call
          var _updateEventUrl = "https://api.meetup.com/2/event/"+ matchingEvent[0].id +"?sign=true&key=" + _meetupApiKey;

          // Update the event
          request.post(_updateEventUrl, {form:eventUpdateData}, function (err, response, body){
            if(! err && response.statusCode == 200) {
              // Event successfully updated
              cb(null, STATUS_OK);
            } else {
              cb(err, null);
            }
          });
        }

      } else {
        cb(error, null);
      }
    });
  };


  return {
    trigger :function(talks, cb) {

      if(!talks.event || !talks.event.talks) {
        // Missing Event or missing list of talks
        cb("Missing Event or missing list of talks", null);
      }

      async.waterfall([
        // Check if the venue exists
        function(callback) {
           _getVenueId(talks.event.venue, function(err, venueId){
              if(err) {
                callback(err, null);
              } else {
                callback(null, venueId);
              }
           });
        },

        // Check if the event related to the talk already exists in meetup
        function(venueId,callback) {
          _createOrUpdateEvent(venueId, talks, function(err, status){
              if(err) {
                callback(err, null);
              } else {
                callback(null, status);
              }
          });
        }
      ], function(err, result){
          cb(err, result);
      });

     
    }
  }
};
  
exports = module.exports = meetup;