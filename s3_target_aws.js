const aws = require('aws-sdk');

var s3params_target = {
  Bucket: "cfdstarget",
};

const s3 = new aws.S3();
const allitems_target = (params,callback)=>{
  s3.listObjects(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else{
      
      callback( data.Contents.map(data=> data.Key))
      //console.log(data)
    }
 });
}

module.exports = {  
  s3params_target ,
  allitems_target
}
