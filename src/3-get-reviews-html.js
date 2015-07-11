
var app = require( "./setup" );

try{

	var reviewCollection = app.getDbCollection( "reviews" );
	
  var criteria = { 
		"html": {
      $exists: false
    }
	};
  
  var maxLimit = 1;
  
	var allReviews = reviewCollection.find( criteria ).limit( maxLimit );
  
  while( allReviews.count() > 0 ) {
  
    allReviews.forEach(function( review ){
    
      app.info( review.number );
         
      var dom = app.parseHtmlFromUrl( review.url );
      
      //find the review div
      var reviewDiv = dom( "div[id^=review]" );
      
      if( reviewDiv.length == 0 ) {
        app.info( "Got ZERO reviews." );
        review.html = "0";
        reviewCollection.update( {"_id": review._id }, review );
      }
      else {
        app.info( "Got " + reviewDiv.length + " reviews." );
        
        for( var i=0; i<reviewDiv.length; i++) {
      
          var number = reviewDiv.eq( i ).attr( "id" ).substring( 7 );
          var thisReview = reviewCollection.findOne({ number: number });

          var html = reviewDiv.eq( i ).html();
          if( html == " " || html == "" || html == "\n" ) {
            app.info( "Review DIV is empty!" );
            html = "";
          }
          
          // if the review is not in the database, then save the new review
          if( thisReview === undefined ) {
            app.info( "Saving review " + number );
            //app.writeFile( "review-" + number + ".url", review.url );
            //app.writeFile( "review-" + number + ".html", dom.html() );
            var newReview = {
              number: number,
              hotel: review.hotel,
              url: review.url.replace("-r" + review.number + "-", "-r" + number + "-"),
              html: html
            };
            reviewCollection.insert( newReview );
          }
          // ignore the review if it has already non-empty HTML
          else if( thisReview.html && thisReview.html!=="" ) { 
            app.info( "Skipping review " + number + " HTML=" + (thisReview.html.length>32 ? thisReview.html.substr(0, 30) + "..." : thisReview.html ) );
          }
          else {
            thisReview.html = html;
            
            app.info( "Updating review " + number + " HTML=" + (thisReview.html.length>32 ? thisReview.html.substr(0, 30) + "..." : thisReview.html ) );
            
            reviewCollection.update( {"_id": thisReview._id }, thisReview );
          }
        }
        
        // mark the review as deleted in case there is no review div for it in the current HTML
        if( dom( "div#review_" + review.number + "" ).length == 0 ) {
          review.html = "1";
          reviewCollection.update( {"_id": review._id }, review );
        }
      }
      
    });

    allReviews = reviewCollection.find( criteria ).limit( maxLimit );
    
  }
  
} 
catch (err) {
  throw err;
} 
finally {
	app.server.close();
}
 