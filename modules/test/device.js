const request = require('request');
const random = require('../../modules/random');

var server = ["http://localhost:3000", "https://makentu2019-test.herokuapp.com"][parseInt(process.argv[2])||0];
var device;
var spaceStatus = true;
var updatePID = [0, 1, 2];
var space = [
  {
    "pid":0,
    "status":false,
    "floor":"B1",
    "price":0
  },{
    "pid":1,
    "status":false,
    "floor":"B1",
    "price":0
  },{
    "pid":2,
    "status":true,
    "floor":"1",
    "price":0
  }
];
function registered(){
  let value = {
    uuid:random(8),
    lat:25.0131203+(Math.random()*0.01-0.005),
    lon:121.5368873+(Math.random()*0.01-0.005),
    name:"virtualDevice",
  };
  let option = {
    url:`${server}/api/registered?uuid=${encodeURI(random(8))}&lat=${value.lat}&lon=${value.lon}&name=${value.name}`
  };
  request(option, (e,r,d)=>{
    device = JSON.parse(d);
    console.log("registered",device);
    update();
  });
}

function update(){
  let spaceData = [];
  for(var pid of updatePID){
    console.log(space[pid])
    spaceData.push(space[pid]);
  }
  let option = {
    url:server+"/api/update",
    form:{
      token:device.token,
      status:spaceStatus,
      space:JSON.stringify(spaceData)
    }
  }
  if(spaceData.length>0)
    request.post(option, (e,r,d)=>{
      console.log("停車場狀態: ");
      console.log(`send:`, spaceData);
      console.log("update status", r.statusCode, new Date(), d);
      status();
    });
  else{
    console.log("停車場狀態(未改變): ");
    console.log(`send:`, spaceData);
    console.log("update status", new Date());
    status();
  }
}

function status(){
  let option = {
    url:server+"/api/status?lat=25.0131203&lon=121.5368873"
  }
  request(option, (e,r,d)=>{
    let data = JSON.parse(d);
    console.log("analog data:\n", data);
    for(var db of data)
      console.log('space:',db.space);
    //remove();
    setTimeout(()=>{
      updatePID = [];
      spaceStatus = false;
      for(var i=0;i<space.length;i++){
        let nextStatus = (Math.random()>.5);
        if(space[i]['status']!=nextStatus){
          updatePID.push(i);
        }
        if(space[i]['status']==true)
          spaceStatus = true;
        space[i]['status'] = nextStatus;
      }
      console.log(updatePID);
      
      spaceStatus = false;
      for(var i=0;i<space.length;i++){
        if(space[i]['status']==true){
          spaceStatus = true;
          break;
        }
      }
      update();
    }, (Math.random()*4000+1000));
  });
}

function remove(callback){
  request(server+'/api/remove?index='+device.id, (e,r,d)=>{
    return callback(d);
    //registered();
  });
}

process.on('SIGINT', function() {
  console.log('remove device...');
  remove((result)=>{
    console.log(result);
    process.exit();
  });
});

registered();
