HttpInterceptor = HttpInterceptor || {};

_.extend(HttpInterceptor, {

  reset: function () {
    Meteor.call('/HttpInterceptor/reset')
  }

});

Template.httpCalls.helpers({
  'calls': function () {
    return HttpInterceptor.Calls.find({}, {sort: {timestamp: -1}}).fetch();
  },
  'shouldShow': function() {
    return Session.get('httpInterceptorEnabled');
  }
});

Template.httpCall.helpers({
  'timestamp': function () {
    return moment(this.timestamp).format("HH:mm:ss.SSS");
  }
});

Template.httpCall.events({
  'click td': function () {
    console.log(this);
  }
});

// TODO call this and dump to a file on the server
// JSON.stringify(HttpInterceptor.Calls.find({}, {sort : {timestamp: 1}}).fetch());
