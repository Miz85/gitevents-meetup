var config = {
	"meetup": {
	  "apikey": "192f34a623f3e4b5e7966382c4b4a1d",
	  "groupid": "18345715"
	}
};

var meetup = require('./meetup')(config);

meetup.trigger({"name":"test"}, function(err, result){
	console.log("hello");
});
// meetup.trigger();