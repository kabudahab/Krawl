  var app = require('./setup');
  var util = require('util');

  try{
  
    var cityCollection = app.getDbCollection( "cities" );
  	var hotelCollection = app.getDbCollection( "hotels" );
		var reviewCollection = app.getDbCollection( "reviews" );
    var userCollection = app.getDbCollection( "users" );
    
    //find the requested city
    var cityNumber = process.argv[2];
    //console.log( "City number " + cityNumber );
    var city = cityCollection.findOne({
      number: cityNumber
    });
      
    //get all hotels in the city
		var hotels = hotelCollection.find({
      city: city._id
    });
    
    var formattor = '"%s"',
        sep = "|";
    for(i=0; i<25; i++) {
      formattor += sep + '"%s"';
    }
    
    var print = console.log;
    /*function(){
      console.log(
        "\"" + csv.stringify( arguments, "\", \"") + "\""
      );
    };*/
    
    //print file header
    print(
      formattor,
      //city data:
      "city number", "city name",
      //hotel data:
      "hotel number", "hotel name",
      //user data:
      "user name", "unser location", "user totalReviewBadge", "user contributionReviewBadge",
      //review data:
      "review number", "overallRating", "valueRating", "locationRating", "sleepRating", "roomsRating", "cleanRating", "serviceRating", "commentTitle", "comment", "reviewDate", "mobileReview", "context", "helpfulRecord", "reponseStaff", "responseDate", "responseContent", "language"
    );
    
		hotels.forEach(function( hotel ){
    		  		  
      var reviews = reviewCollection.find({ hotel: hotel._id });
			
			reviews.forEach(function( review ){
      
        var user = {};
        if( review.user ) {
          var user = userCollection.findOne({ _id: review.user });
        }
        else {
          user = {
            username: "", 
            location: "", 
            totalReviewBadge: "", 
            contributionReviewBadge: ""
          };
        }
        
			  print(
          formattor,
          //city data:
          city.number, city.name,
          //hotel data:
          hotel.number, hotel.name,
          //user data:
          user.username, user.location, user.totalReviewBadge, user.contributionReviewBadge,
          //review data:
          review.number, review.overallRating, review.valueRating, review.locationRating, review.sleepRating, review.roomsRating, review.cleanRating, review.serviceRating, review.commentTitle, review.comment, review.reviewDate, review.mobileReview, review.context, review.helpfulRecord, review.reponseStaff, review.responseDate, review.responseContent, review.language);
			});
		});
 
	} catch (err) {
    throw err;
	} finally {
		app.server.close();
	}
 