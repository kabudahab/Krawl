
var app = require('./setup');
var util = require('util');

try{

	var cityCollection = app.getDbCollection( "cities" );
  var hotelCollection = app.getDbCollection( "hotels" );  
	var reviewCollection = app.getDbCollection( "reviews" );
  var userCollection = app.getDbCollection( "users" );
  var cities, hotels, reviews, users;
  
  //{ Step I: find the number of hotel pages for each city
    
    //find all cities without number of pages (newly added cities)
    cities = cityCollection.find({ 
      numberOfPages: 0 
    });
    
    //get and save the number of hotel pages of each city
    cities.forEach(function( city ){
      
      var $ = app.parseHtmlFromUrl( city.url );
      
      var pages = $( ".pageNumbers .pageNum" ).last().html();
      if ( pages=== null ) {
        app.throwError( "Pager not found!" );
      }
      else {
        city.numberOfPages = pages;
        cityCollection.update( {"_id": city._id }, city );
      }
      
    });
   
  //} End of Step I 
 
  //{ Step II: collect the names and URLs of hotels in each city
     
    //find all cities with a page count
    cities = cityCollection.find({ $where: "this.currentPage < this.numberOfPages || this.currentPage==0" });
    
    cities.forEach(function( city ){
      var cityUrlFormatString = city.url.replace( "/Hotels-g" + city.number + "-", "/Hotels-g" + city.number + "%s" );
          currentPage = city.currentPage,
          numberOfPages = city.numberOfPages;

      for(var i=currentPage; i<numberOfPages; i++) {

        app.info( "Processing city: " + city.name + " page " + (i+1) + "..." );

        var pageUrl = "";
        if( i==0 ) {
          pageUrl = util.format(cityUrlFormatString, '-');
        }
        else {
          pageUrl = util.format( cityUrlFormatString, "-oa" + (i*30) + "-" );
        }
        
        var $ = app.parseHtmlFromUrl( pageUrl );
        var hotelLinks = $( ".property_details .listing_info .listing_title > a" );

        if( hotelLinks.length == 0 ) {

          app.info( 'City page has no hotel links: ' + pageUrl );
          app.info( 'Sleeping for 5 secons then try again...');				

          sleep( 5000 );

          $ = app.parseHtmlFromUrl( pageUrl );
          hotelLinks = $( ".property_details .listing_info .listing_title > a" );

          if( hotelLinks.length == 0 ) {
            throw new Error( 'City page has no hotel links: ' + pageUrl );
          }
        }

        var saved = 0, skipped = 0;

        hotelLinks.each( function(index, el){

          var hotel = {
            number: "",
            name: "",
            url: "",
            city: city._id,
            numberOfPages: 0,
            currentPage: 0
          };

          var link = $(this);
        
          hotel.name = app.trimString( link.text() );
          hotel.number = link.attr( "id" ).replace( "property_", "" );
          hotel.url = link.attr( "href" );

          if( hotelCollection.find( { number: hotel.number } ).count() == 0 ) {
            app.info( "Saving hotel " + hotel.number + " " + hotel.name );
            saved++;
            hotelCollection.insert( hotel );
          }
          else {
            
            app.debug('Skipping hotel ' + hotel.url);
            skipped++;
          }
        });

        app.info('Hotels saved: ' + saved + ', hotels skipped: ' + skipped );

        // update current page counter (the number of last saved page)
        city.currentPage = city.currentPage + 1;
        cityCollection.update( {"_id": city._id }, city );
        
      }
      
    });

  //} End of Step II
  
  //{ Step III: find the number of review pages of each hotel

    //find all hotels without a page count
		var hotelsWithoutPageCount = hotelCollection.find( { numberOfPages: 0 } );

		hotelsWithoutPageCount.forEach(function( hotel, i ){

			//app.info( "Requesting " + hotel.url );
			var $ = app.parseHtmlFromUrl( hotel.url );

			var pages = $( '.pagination .pgLinks a.paging.taLnk' ).last().html();

			if( pages == null ) {
				pages = 1;			
			}

			hotel.numberOfPages = pages;
			hotel.currentPage = 0;

			app.info( 'Hotel ' + i + ': ' + hotel.name + ' has ' + pages + ' pages.' );

			hotelCollection.update( { "_id": hotel._id }, hotel );
      
		});

  //} End of Step III
  
} catch (err) {
throw err;
} finally {
	app.server.close();
}
