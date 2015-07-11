var app = require('./setup');

try{
	
	//get a collection (i.e. table)
	var cityCollection = app.getDbCollection( "cities" );
  var city = null;
  
  city = app.parseCityUrl( "http://www.tripadvisor.co.uk/Hotels-g186346-York_North_Yorkshire_England-Hotels.html" );
	cityCollection.insert( city );
	app.debug( city );
  
} 
catch (err) {
  throw err;
} 
finally {
	app.server.close();
}
