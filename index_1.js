'use strict';

var express = require('express');
var app = express();

const http = require('http').Server(app);

http.listen(9010, () => {
    console.log('listening on localhost:9010');
});

const io = require('socket.io')(http);

var spawn = require('child_process').spawn;

var dataBuffer  = null;
var initBuffer  = null;
var initFrame   = null;

var ffmpeg_options  = '-threads 1 -f v4l2 -i /dev/video1 -video_size 1280x720 \
                      -c:v copy -f mp4 -g 1 -movflags empty_moov+default_base_moof+frag_keyframe -frag_duration 150000 \
                      -tune zerolatency -';
                      
app.get('/', (req, res) => {
    res.sendfile(__dirname + '/index.html');
});

app.get('/flv.min.js', (req, res) => {
    res.sendfile(__dirname + '/node_modules/flv.js/dist/flv.min.js');
});
                     
/*********************************
**ffmpeg catapring stdout process.
* 
* *******************************/
var child = spawn( 'ffmpeg', ffmpeg_options.match( /\S+/g ) );

  child.stdout.on('data', function(data){
    if( initFrame === null ){
	      
      initBuffer = initBuffer == null ? data : Buffer.concat( [initBuffer,data] );
      
      if( initBuffer.length < 25 ){
        return;
      }
      
      initFrame = initBuffer;
      //console.log("File saved successfully!");
      //daemon.emit( "init." + camera + "_" + channel, initFrame );
      return;
    }
    ///console.log(data.length);
    //Crude hack to gather the output from ffmpeg stdout in to full frames before emitting.
    if( data.length == 8192 ){
      dataBuffer = dataBuffer == null ? data : Buffer.concat([dataBuffer,data]);;
      console.log('done');
      }
    dataBuffer = dataBuffer == null ? data : Buffer.concat([dataBuffer,data]);
    child.emit('event', dataBuffer);
    //daemon.emit( "data." + camera + "_" + channel, data );
    //dataBuffer = null;
  });
  
  child.stderr.on('data', function(error)
  {
  	  console.log("FFMPEG: " + error.toString());
  	  //var timeStampInMs = window.performance && window.performance.now && window.performance.timing && window.performance.timing.navigationStart ? window.performance.now() + window.performance.timing.navigationStart : Date.now();
     
  });
  
// child.on('event', function(data){
//   console.log(data, this);
//   // Prints: a b {}
// });

io.on('connection', function(socket) {

    console.log('A user connected');
    
    function start() {
        if (initFrame) {
            socket.emit('segment', initFrame);
            child.on('event', emitSegment)
            //mp4segmenter.on('segment', emitSegment);
        } else {
            socket.emit('message', 'init segment not ready yet, reload page');
        }
    }
    
    function emitSegment(data) {
        console.log(data.length);
        socket.emit('segment', data);
    }
    
    socket.on('message', (msg) => {
        switch (msg) {
            case 'start' :
                start();
                break;
        }
    });
    
    socket.on('disconnect', () => {
        //stop();
        console.log('A user disconnected');
    });
});
