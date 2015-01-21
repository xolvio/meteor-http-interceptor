HttpInterceptor = HttpInterceptor || {};

HttpInterceptor.Calls = new Mongo.Collection('HttpInterceptor.Calls');

if (typeof window !== 'undefined') {
  window.HttpInterceptor = HttpInterceptor;
}

if (Meteor.isServer) {
  Meteor.publish('HttpInterceptor.Calls', function () {
    return HttpInterceptor.Calls.find({});
  });
}

if (Meteor.isClient) {
  Meteor.subscribe('HttpInterceptor.Calls');
}