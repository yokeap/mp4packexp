'use strict';               // use strict mode *serious programming

var spawn = require('child_process').spawn;
var sleep = require('sleep');
var self  = this;
var fs = require('fs');

var time = new Date().getTime()

var dataBuffer  = null;
var initBuffer  = null;
var initFrame   = null;

var ffmpeg_options  = '-threads 1 -f v4l2 -i /dev/video1 \
                      -c:v copy -f mp4 -g 1 -movflags empty_moov+default_base_moof+frag_keyframe -frag_duration 150000 \
                      -tune zerolatency -';

//var ffmpeg_options  = '-threads 1 -f lavfi -re -i testsrc=size=1280x720:rate=30:decimals=10 -f mp4 -g 1 -threads 2 -movflags empty_moov+default_base_moof+frag_keyframe -profile:v main -level 31 -pix_fmt yuv420p -tune zerolatency -';
                      
console.log(ffmpeg_options.match(/\S+/g));

function printTimeStamp(){
   var timestamp=new Date();
      console.log("System time: " + timestamp.getSeconds() + ":" + timestamp.getMilliseconds());
      return true;
}

var child = spawn( 'ffmpeg', ffmpeg_options.match( /\S+/g ) );

  child.stdout.on('data', function(data)
  {
    if( initFrame === null )
	  {
	      
      initBuffer = initBuffer == null ? data : Buffer.concat( [initBuffer,data] );
      console.log(initBuffer);
      
      if( initBuffer.length < 25 )
	    {
	        fs.writeFile("./testout/header.mp4", initBuffer, function(err) {
          if(err) {
            return console.log(err);
          }
      });
        return;
      }
      
      initFrame = initBuffer;
      
      fs.writeFile("./testout/testout0.mp4", initFrame, function(err) {
          if(err) {
            return console.log(err);
          }
      });
      //console.log("File saved successfully!");
      //daemon.emit( "init." + camera + "_" + channel, initFrame );
      //return;
    }
    console.log(data.length);
    //Crude hack to gather the output from ffmpeg stdout in to full frames before emitting.
    if( data.length == 8192 )
	  {
      dataBuffer = dataBuffer == null ? data : Buffer.concat([dataBuffer,data]);;
      
      console.log('done');
      process.exit();
      //return;
    }
    dataBuffer = dataBuffer == null ? data : Buffer.concat([dataBuffer,data]);
    
    fs.writeFile("./testout/testout1.mp4", dataBuffer, function(err) {
          if(err) {
            return console.log(err);
          }
      });
      sleep.usleep(1000);
      printTimeStamp();
      //console.log('done');
    //console.log(dataBuffer.length);
    //daemon.emit( "data." + camera + "_" + channel, data );
    dataBuffer = null;
	
  });
  
  child.stderr.on('data', function(error)
  {
  	  console.log("FFMPEG: " + error.toString());
  	  //var timeStampInMs = window.performance && window.performance.now && window.performance.timing && window.performance.timing.navigationStart ? window.performance.now() + window.performance.timing.navigationStart : Date.now();
     
  });
  
