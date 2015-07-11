  var app = require('./setup');
  
  console.log("set exportpath=c:\data\exports\\n\n");

  try{
  
    var cityCollection = app.getDbCollection( "cities" );
    
    var cities = cityCollection.find();
    
    cities.forEach(function( city ){
      
      console.log( "rem common-node export-reviews.js " + city.number + " > %exportpath%" + city.name + ".csv\n"  );
      
		});
 
	} catch (err) {
    throw err;
	} finally {
		app.server.close();
	}
 