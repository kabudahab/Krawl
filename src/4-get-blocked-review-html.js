console.log( new Date() );

var MongoClient = require('mongodb').MongoClient;
var format = require('util').format;
var phantom = require('phantom');
var queue = 0;

console.log( "Connecting to db..." );

MongoClient.connect('mongodb://127.0.0.1:27017/tripAdvisorReviews', function(err, db) {

  console.log( "Db connected" );

  var timerknock = setTimeout( function(i){
      console.log( "--------------------------------------------------------------" );
      console.log( "                           TIMEOUT                            " );
      console.log( "--------------------------------------------------------------" );
      db.close();
      process.exit(1);
  }, 60*1000 );
  
  if(err) {
    throw err;
  }

  var reviewCollection = db.collection('reviews');
  
  var allReviews = null,
      allCount = 0,
      doneFlags = new Array();
  
  console.log( "Fetching data..." );
    
  reviewCollection.find({
    $or: [
      { "html": null },
      { "html": "" },
      { "html": " " },
      { "html": "0" },
      { "html": "\n" }
    ]
    //"status": 6
	}).limit(10).toArray(function(err, results) {
  
    console.log( "Data recevied." + results.length);
  
    allReviews = results;
    allCount = results.length;
    
    doneFlags = new Array(allCount);
    for(var i=0; i<allCount; i++) {
      doneFlags[ i ] = 0;
    }
    
    for(var i=0; i<allCount; i++) {
      console.log( '%s %s', i, allReviews[ i ].number );
      getReviewHtml( i );
    }

  });
  
  var getReviewHtml = function(index){
      
    var review = allReviews[ index ];
    var url = "http://tripadvisor.co.uk" + review.url;
          
    var freeport = 40000+(queue*1000)+index;
    
    //console.log('Port %s', freeport);

    phantom.create({'port': freeport}, function(ph) {
    
      ph.createPage(function(page) {
      
        page.open(url,
          function(status) {
            console.log('%s: Opened site? %s', index, status);

            page.evaluate(function(number) {

              var results = document.querySelector('#review_'+number); 

              return results.innerHTML;
            },
            function(result) {
            
              console.log("Done evaluate: %s", index);

              if ( result && (typeof result === "string") && result!=" " ) {
                console.log( "%s: OK", review.number );
                review.html = result;
              }  
              else {
                console.log( "%s: NO HTML!", review.number );
                review.html = "phantom failed";
              }
              
              reviewCollection.update( {"_id": review._id }, review, function(err) {
                if(err) {
                  throw err;
                }
                
                ph.exit();
                doneFlags[index] = 1;
                
                var done = true;
                for(var i=0; i<allCount; i++) {
                  if( doneFlags[ i ] == 0 ) {
                    done = false;
                    break;
                  }
                }
                
                //console.log(doneFlags);   
                //console.log("%s out of %s", doneFlags.length, allCount)
                                  
                if( done ) {
                  db.close();
                  console.log( new Date() );
                  clearTimeout(timerknock);
                }
               
              });

            }, review.number);        
            
          });
          
      });
      
    });
  
  };
  
});
