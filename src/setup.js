
//{ Require modules
	
  var HttpClient = require("httpclient").HttpClient;

	var util = require('util');

	var htmlparser = require("htmlparser");

	var cheerio = require('cheerio');

	var sleep = require('system').sleep;

	//include mongo sync library (no need for asynchronous connections)
	var mongo_sync = require( "mongo-sync" );

	var fs = require('fs-base');
  
  var S = require('string');

//}

//{ Extensions
  
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
      position = position || 0;
      return this.indexOf(searchString, position) === position;
    };
  }
  
//}

//{ Global variables
	
  var SLEEP_BETWEEN_REQUSTS = 100;
  var RETRY_ON_ERROR = true;

//}

//{ Debug functions

	var debug = function(message){
		console.log( message );
	};
	var info = function(message){
		console.log( message );
	};
	var logError = function(error){
		var errorCollection = getDbCollection( "errors" );
		errorCollection.insert( error );
		console.log( error );
	};

//}

//{ MongoDB connectivity

	var server = new mongo_sync.Server( "127.0.0.1" );

	var getDbCollection = function(collectionName){
		// connect to database
		var db = server.db( "tripAdvisorReviews" );
	
		// get a collection (i.e. table)
		var collection = db.getCollection( collectionName );

		return collection;
	};

//}

//{ HTML parsing functions

	var getRequest = function(url){

		debug( "Request " + url );
		
    //sleep( SLEEP_BETWEEN_REQUSTS );

		var result = new HttpClient({
			url: url,
	    timeout: 10*1000
		})
		.finish();
    
    var statusCode = result.body.stream.statusCode;
    var location = result.body.stream.headers.location;
        
    if( statusCode == "301" ) {
      var redirectUrl = result.body.stream.headers.location[0];
      debug( "Redirected to " + redirectUrl );
      return getRequest( redirectUrl );
    }
    else {
      return result;
    }
	};
  
	var getHtmlFromUrl = function(url){
  
    var fullUrl = "http://www.tripadvisor.co.uk" + url;
    var result = getRequest( fullUrl );
    var html = result.body.read().decodeToString();
		return html;
    
		var result = new HttpClient({
			url: "http://www.tripadvisor.co.uk" + url,
	    timeout: 10*1000
		})
    /*.setHeader("host", "www.tripadvisor.co.uk")
    .setOption("headers", { 
			"User-Agent" : "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:26.0) Gecko/20100101 Firefox/26.0",
			"Accept": "text/html,application/xhtml+xml,application/xml",
			"Accept-Language": "en-gb,en;q=0.5",
			"Accept-Encoding": "gzip, deflate",
			"DNT": "1",
			"Referer": "http://www.tripadvisor.co.uk/Hotel_Review-g186338-d1139866-Reviews-Hotel_Indigo_London_Paddington-London_England.html",
			"Cookie": "v1st=6BBA537BC188EDD5; CM=%1%FtrSess%2C%2C-1%7CHanaPersist%2C%2C-1%7CHomeAPers%2C%2C-1%7CRCPers%2C%2C-1%7Cbrandpers%2C1%2C1391017784%7CSaveFtrSess%2C%2C-1%7CTCPPer%2C1%2C1391633557%7CSaveFtrPers%2C%2C-1%7CHanaSession%2C%2C-1%7CTCPSes%2C%2C-1%7CCCPers%2C%2C-1%7Csessamex%2C%2C-1%7CBPPers%2C5%2C1391017808%7CMetaFtrSess%2C%2C-1%7CMetaFtrPers%2C%2C-1%7CFtrPers%2C%2C-1%7Csh%2C%2C-1%7CRCSess%2C4%2C-1%7CWShadeSeen%2C%2C-1%7CHomeASess%2C%2C-1%7CWAR_RESTAURANT_FOOTER_PERSISTANT%2C%2C-1%7CRBASess%2C%2C-1%7CCCSess%2C4%2C-1%7CWAR_RESTAURANT_FOOTER_SESSION%2C%2C-1%7CRBAPers%2C%2C-1%7Cpssamex%2C%2C-1%7C; cookieconsent=1; __utma=135521460.1635888273.1360096248.1390418004.1390422092.20; __utmz=135521460.1379944696.17.15.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided); TAUnique=%1%enc%3AISH%2B0%2FEofp7NN3jmOFWxzspyWLgaynYCMsVF3H6yARlNyVX3VCAoLQ%3D%3D; fbm_162729813767876=base_domain=.tripadvisor.co.uk; TASocialNetwork=%1%E.gi%2FUX9M0PU5M%2FO5d%2FPaooh9XWgxHiXP72InW10ah%2Bp1WxV4AI118hQ%3D%3D; TACds=B.3.17334.2.2013-12-12; TATravelInfo=V2*A.2*MG.-1*HP.2*FL.3*RVL.2309633_22l566466_22l1139866_22; CommercePopunder=SuppressAll*1390413011304; TASession=%1%V2ID.DA7BC7C2F12DEAE0A617CB43B0061C55*SQ.52*LS.Hotel_Review*GR.17*TCPAR.74*TBR.69*EXEX.30*ABTR.14*PPRP.43*PHTB.99*FS.19*CPU.88*HS.popularity*ES.popularity*AS.popularity*DS.5*SAS.popularity*FPS.oldFirst*DF.0*FP.%2FHotels-g186338-London_England-Hotels%5C.html*LP.%2FHotels-g186338-London_England-Hotels%5C.html*FS.30*MS.-1*RMS.-1*TRA.true*LL.3781600*LD.236350*BG.186338*BT.hr2aso*EWS.HotelCheckRates; ServerPool=C; BEPIN=%1%143bb5f13b2%3Bbak11b%3A5465%3Brev06b%3A8754%3Bmed06b%3A8739%3Bbak03b%3A9092%3Bper03b%3A7676%3Bcmc06b%3A9387%3Btyp03b%3A4674%3Blsc08b%3A7475%3B; TAReturnTo=%1%%2FHotel_Review-g186338-d1139866-Reviews-or840-Hotel_Indigo_London_Paddington-London_England.html; roybatty=AAABQ7tfFaWCGL9YhAR%2BQQXVTX0Tsuxzl3uHQg%3D%3D%2C43; __utmc=135521460; __utmb=135521460.28.9.1390427455293; NPID=",
			"Connection": "keep-alive",
			"Cache-Control": "max-age=0"
		})*/
		.finish();
    
    var statusCode = result.body.stream.statusCode;
    var location = result.body.stream.headers.location;
    
    var html = result.body.read().decodeToString();
    
    if( statusCode == "301" ) {
      
      var redirectUrl = result.body.stream.headers.location[0];
      info( "Redirected to " + redirectUrl );
      //html = getHtmlFromUrl( redirectUrl );
    }
    
		return html;
	};

	var parseHtmlString = function (html) {
		//var handler = new htmlparser.DefaultHandler();
		//var parser = new htmlparser.Parser(handler);
		//parser.parseComplete(html);
		//return handler.dom;
		return cheerio.load(html, {
			normalizeWhitespace: true		
		});
	};

	var parseHtmlFromUrl = function (url) {
		var html = getHtmlFromUrl( url );
		var $ = parseHtmlString(html);
		return $;
	};
  
  var throwError = function(e){
    throw new Error(e);
  };
  
  var domElementExists = function( el ) {
    if( el.length==0 ) {
      throwError("DOM element do not exist! " + el);
    }
    
    return true;
  };
  
  var getDomElement = function( dom, selector, throwErrorIfEmpty ) {
  
    var el = dom.find ? dom.find(selector) : dom(selector);
  
    if( el.length==0 ) {
      if( throwErrorIfEmpty ) {
        writeFile( "./Empty DOM element.html", dom.html() );
        throwError("DOM element do not exist! " + el);
      }

      return false;
    }
    else {
      return el;
    }
  };
  
  var trimString = function( s ) {
    return S( s ).trim().s;
  }

  var writeFile = function(filename, content){
    //app.info( fs.workingDirectory() ); 
    //var html = dom.html();
    fs.write ( "./" + filename, content );
  };
  
  var setTimeout = function( seconds ){
    console.log( "Setting timeout to %s seconds.", seconds );
    var timerknock = setTimeout( function(){
        console.log( "--------------------------------------------------------------" );
        console.log( "                           TIMEOUT                            " );
        console.log( "--------------------------------------------------------------" );
        server.close();
        process.exit(1);
    }, seconds*1000 );
    return timerknock;
  };

//}

//{ Application functions

  //URL example: http://www.tripadvisor.co.uk/Hotels-g186346-York_North_Yorkshire_England-Hotels.html
  var parseCityUrl = function( url ) {
    
    if( url.startsWith( "http://www.tripadvisor.co.uk/" ) ) {
      url = url.substr( "http://www.tripadvisor.co.uk".length );
    }
    debug(url);
    var regex = /^\/Hotels-g([0-9]+)-(.*)-Hotels(.*)$/
    var result = url.match(regex);
    debug(result);
    var domainName = result[0];
    var cityNumber = result[1];
    var cityName = result[2];
  
    var city = {
      name: cityName,
      url: url,
      number: cityNumber,
      numberOfPages: 0,
      currentPage: 0
    };
  
    return city;
  
  };
  
  var getReviewDiv = function ( review ) {

    var selector = '#review_' + review.number;
    
    debug( selector );

    var dom = app.parseHtmlFromUrl( review.url );
      
    //find the review div
    var reviewDiv = dom( selector );
    
    return reviewDiv;
  };


//{ Expose functions to be used by application

  module.exports = {
    server: server,
    
    debug: debug,
    info: info,
    logError: logError,
    throwError: throwError,
    
    getDbCollection: getDbCollection,
    
    getRequest: getRequest,
    getHtmlFromUrl: getHtmlFromUrl,
    parseHtmlString: parseHtmlString,
    parseHtmlFromUrl: parseHtmlFromUrl,
    
    domElementExists: domElementExists,
    getDomElement:getDomElement,
    trimString: trimString,
    
    writeFile: writeFile,
    setTimeout: setTimeout,
    
    parseCityUrl: parseCityUrl,
    getReviewDiv: getReviewDiv
    
  };

//}
