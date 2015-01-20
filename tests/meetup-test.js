var test = require('tape');
var config = require('./data/config.js');
var talks = require('./data/talks.js');

var meetup = require('../meetup.js')(config);

test("Meetup module has a trigger function", function(t){
	t.plan(1);
	t.equal(typeof meetup.trigger, 'function');
});

test("Meetup trigger function", function(t){
	t.plan(1);		

	setTimeout(function(){
		meetup.trigger(talks, function(err, result){
			t.error(err);
		});
	}, 50);

});

test("Meetup trigger function throws error if input is incorrect", function(t){
	t.plan(1);		

	setTimeout(function(){
		meetup.trigger("", function(err, result){
			t.true(err.stack);
		});
	}, 50);

});
