/*
Review status codes
===================

code  details
----  -------  
0     HTML processed sucessfully (by Liwei)
1     HTML processed sucessfully (by Khalil)
2     HTML is empty or missing
3     HTML processed sucessfully (by Khalil)
4     HTML is empty or missing

*/

var success_status_code = 5,
    fail_status_code = 6;    

console.log( new Date() );

var fs = require('fs-base');
var app = require('./setup');

try{

	var reviewCollection = app.getDbCollection( "reviews" );
  var userCollection = app.getDbCollection( "users" );
  var hotelCollection = app.getDbCollection( "hotels" );  
  
	var allReviews = reviewCollection.find({ 
      //"status": 6
      "status": {$exists: false}
	}).limit(1*1000);
    
	allReviews.forEach(function( review ){
    
      app.info(review.number);
      
      //app.writeFile(review.number+".html", review.html);
      
      if( (typeof review.html !== "string") || review.html=="" || review.html=="0" || review.html=="1" || review.html=="\n" || review.html==" " ) {
        app.info( "No HTML!" );
        review.status = fail_status_code;
      }
      else {
        var reviewDiv = app.parseHtmlString( review.html );
        
        var col20f2 = app.getDomElement( reviewDiv, 'div.col2of2' );

        if( col20f2===false ) {
          //incomplete review HTML, flag it to be processed by phantomjs
          app.info("Incomplete HTML.");
          review.html = "0";
          //review.status = fail_status_code;
        }
        else {
          //find the overall rating
          var overallRatingElement = app.getDomElement( reviewDiv, 'div.rating span.rate img' );
          review.overallRating =  overallRatingElement ? overallRatingElement.attr("content") : "";

          //save value rating
          var valueRatingElement = app.getDomElement( reviewDiv, '.recommend-answer:contains("Value") span img' );
          review.valueRating = valueRatingElement ? valueRatingElement.attr('content') : "";
          
          //save location rating
          var locationRatingElement = app.getDomElement( reviewDiv, '.recommend-answer:contains("Location") span img' );
          review.locationRating = locationRatingElement ? locationRatingElement.attr('content') : "";
          
          //save sleep rating
          var sleepRatingElement = app.getDomElement( reviewDiv, '.recommend-answer:contains("Sleep") span img' );
          review.sleepRating = sleepRatingElement ? sleepRatingElement.attr('content') : "";
          
          //save rooms rating
          var roomsRatingElement = app.getDomElement( reviewDiv, '.recommend-answer:contains("Rooms") span img' );
          review.roomsRating = roomsRatingElement ? roomsRatingElement.attr('content') : "";

          //save cleanliness rating
          var cleanRatingElement = app.getDomElement( reviewDiv, '.recommend-answer:contains("Cleanliness") span img' );
          review.cleanRating = cleanRatingElement ? cleanRatingElement.attr('content') : "";

          //save service rating
          var serviceRatingElement = app.getDomElement( reviewDiv, '.recommend-answer:contains("Service") span img' );
          review.serviceRating = serviceRatingElement ? serviceRatingElement.attr('content') : "";

          //get the comment title
          var commentTitleElement = app.getDomElement( reviewDiv, 'div.quote' );
          review.commentTitle = commentTitleElement ? app.trimString(commentTitleElement.text()) : "";
               
          //get the comment
          var commentElement = app.getDomElement( reviewDiv, 'div.innerBubble div p' );
          review.comment = commentElement ? app.trimString(commentElement.text()) : "";
         
          //get review date
          var reviewDateElement = app.getDomElement( reviewDiv, 'div.innerBubble span.ratingDate' );
          review.reviewDate = reviewDateElement ? reviewDateElement.attr('content') : "";

          //get the comment method, mobile or laptop
          var mobileReviewElement = app.getDomElement( reviewDiv, 'div.innerBubble a.viaMobile' );
          review.mobileReview = mobileReviewElement ? mobileReviewElement.text() : "";
      
          //get the context information
          var contextElement = app.getDomElement( reviewDiv, 'span.recommend-titleInline' );
          review.context = contextElement ? contextElement.text() : "";
          
          //get review helpful
          var helpElement = app.getDomElement( reviewDiv, 'span.numHlpIn' );
          review.helpfulRecord = helpElement ? helpElement.text() : "";
                
          //get hotelreponse/reply staff information
          var replyStaffElement = app.getDomElement( reviewDiv, ' div.header' );
          review.reponseStaff = replyStaffElement ? replyStaffElement.text() : "";
       
          //get hotelreponse/reply date
          var replyDateElement = app.getDomElement( reviewDiv, 'div.mgrRspnInline span.res_date' );
          review.responseDate = replyDateElement ? replyDateElement.text() : "";

          //get hotelreponse/reply content
          var replyElement = app.getDomElement( reviewDiv, 'div.displayText' );
          review.responseContent = replyElement ? replyElement.text() : "";
       
          //get user name
          var memberInfo = app.getDomElement( reviewDiv, 'div.member_info' );
          var usernameElement = app.getDomElement( memberInfo, 'span.scrname' );
          if( usernameElement ) {
            var user = {};
            review.username = app.trimString(usernameElement.text());
            
            //check if the user is already saved
            var userArray = userCollection.find( {username: review.username} ).toArray();
            if( userArray.length==0 ) {
              // user is new
              user.username = review.username;
              
              //save user loation
              var locationElement = app.getDomElement( memberInfo, '.location' );
              user.location = locationElement ? app.trimString(locationElement.text()) : "";
              
              var memberBadging = app.getDomElement( reviewDiv, 'div.memberBadging' );
              
              var totalReviewBadge = app.getDomElement( memberBadging, 'div.memberBadging div.totalReviewBadge > span.badgeText' );
              user.totalReviewBadge = totalReviewBadge  ? app.trimString(totalReviewBadge .text()) : "";
              
              var contributionReviewBadge = app.getDomElement( memberBadging, 'div.memberBadging div.contributionReviewBadge > span.badgeText' );
              user.contributionReviewBadge = contributionReviewBadge  ? app.trimString(contributionReviewBadge .text()) : "";
              
              //console.log( user );
              userCollection.insert(user);
            }
            else {
              user = userArray[0];
            }
            
            review.user = user._id;
          }
          
          //add language info
          var googleTranslateElement = app.getDomElement( reviewDiv, 'div.googleTranslation.reviewItem' );
          if( googleTranslateElement )
          {  
            var translateLinkSpan = app.getDomElement( googleTranslateElement, 'span.link' );
            var translateClickEvent = translateLinkSpan.attr( "onclick" );
            
            var languageCode = translateClickEvent.substr( translateClickEvent.indexOf( "&sl=" ) + 4, 2 );
            review.language = languageCode;
            
            var start = translateClickEvent.indexOf( "this, '/" ) + 7;
            var end = translateClickEvent.indexOf( "');" );
            var translateLink = translateClickEvent.substr( start, end-start );
            review.translateLink = translateLink;        
          }
          else {
            review.language = "en";
          }

          //print all fields of the review (remove after testing)
          //app.info(review);
                
          //update the review in the database (do not run for testing)
          review.status = success_status_code;
        }
      
      }
      
      reviewCollection.update( {"_id": review._id }, review );
      //at the end, i should try to find empty username and detect the problems

	});

} catch (err) {
throw err;
} finally {
	app.server.close();
  console.log( new Date() );
}
