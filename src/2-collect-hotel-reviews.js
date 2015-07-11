console.log( new Date() );

var app = require('./setup');
var util = require('util');

//app.setTimeout( 10 );

try{

	var cityCollection = app.getDbCollection( "cities" );
  var hotelCollection = app.getDbCollection( "hotels" );  
	var reviewCollection = app.getDbCollection( "reviews" );
  var userCollection = app.getDbCollection( "users" );
  
  //find hotels which have not been processed yet
  var hotels = hotelCollection.find({ 
    $where: "(this.currentPage < this.numberOfPages || this.currentPage==0)"
  });
  
  app.info( "Number of hotels "  );
  app.info( hotels.count() );

  hotels.forEach(function( hotel ){

    app.info( 'Processing hotel: ' + hotel.name + ' with ' + hotel.numberOfPages + ' pages...' );

    if( hotel.numberOfPages == null ) {
      hotel.numberOfPages = 1;			
    }

    var formatter = hotel.url
                            .replace("/Hotel_Review-", "/ShowUserReviews-")
                            .replace("-Reviews-", "-r%s-");

    for(var i=hotel.currentPage; i<hotel.numberOfPages; i++) {
    
      var pageUrl = hotel.url;
      if(i>0) {
        pageUrl = hotel.url.replace('-Reviews-', '-Reviews-or'+(i*10)+'-');
      }

      app.info( 'Page ' + (i+1) /*+ ": " + pageUrl*/ );

      var $ = app.parseHtmlFromUrl( pageUrl );
      var reviewLinks = $('#REVIEWS .reviewSelector');

      if( reviewLinks.length == 0 ){
        var error = {
          message: "Page has no reviews: " + pageUrl,
          hotel: hotel._id,
          pageIndex: i,
          pageUrl: pageUrl,
          datetime: new Date()
        };
        
        //app.writeFile( "./" + hotel.number + ".url.txt", pageUrl );
        //app.writeFile( "./" + hotel.number + ".html.txt", app.getHtmlFromUrl(pageUrl) );
        if( i>0 ) {
          app.throwError( error.message );
        }
      }

      //app.writeFile( "Hotel " + hotel.number + " Page " + (i+1) + ".html", $.html() );

      var saved = 0, skipped = 0;
      reviewLinks.each( function(index, el){
        var div = $(this);
        
        var reviewNumber = div.attr( "id" ).substr( "7" ),
            reviewUrl = util.format( formatter, reviewNumber );

        var review = {
          number: reviewNumber,
          hotel: hotel._id,
          url: reviewUrl
        };
        
        if( reviewCollection.find({number: review.number}).count() == 0 ) {
          app.debug( "Saving review " + review.number + " " + review.url );
          saved++;
          reviewCollection.insert( review );
        }
        else {
          app.debug('Skipping review ' + review.number);
          skipped++;
        }
      });
      app.info('Reviews saved: ' + saved + ', reviews skipped: ' + skipped );

      // update current page counter (the number of last saved page)
      hotel.currentPage = hotel.currentPage + 1;
      hotelCollection.update( {"_id": hotel._id }, hotel );
    }
    
  });

} catch (err) {
throw err;
} finally {
	app.server.close();
  console.log( new Date() );
}
