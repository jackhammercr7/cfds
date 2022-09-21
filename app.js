const express = require("express");
const PORT = 3000;
const app = express();
const AWS = require("aws-sdk");
const fileUpload = require("express-fileupload");
const path = require('path');
var input_img = null
let result =[]
let input_img_url = null

const Path = path.join(__dirname, '.', 'Public/views');


AWS.config.update({ region: "us-east-1" });

const s3 = new AWS.S3({ params: { Bucket: "inputtarget" } });

const { allitems_target, s3params_target } = require("./s3_target_aws");

// Create an Rekognition Client
var rekognition = new AWS.Rekognition();


const publicdirpath = path.join(__dirname, '/public')
app.use(express.static(publicdirpath))


app.use(
  fileUpload({
    // 50mb file limit
    limits: { fileSize: 50 * 1024 * 1024 },
    abortOnLimit: true,
  })
);

app.get("/", (req, res) => {
  res.sendFile("./Public/views/index.html", { root: __dirname });
});

app.post("/submit", async (req, res) => {
  const { files } = req;

  try {
    const upload = new AWS.S3.ManagedUpload({
      params: {
        // pass directly the buffer string
        Body: files.photo.data,
        // pass the file name
        Key: files.photo.name,
        // make it public
        ACL: "public-read",
      },
      // use the const s3 that we defined above
      service: s3,
    });

    response = await upload.promise();
    console.log(response)
    input_img= response.key
    input_img_url = response.Location;
    res.sendFile(path.join(Path,"find.html"))

    
  } catch (error) {
    res.send(error);
  }
 
});

app.get("/find", (req,res)=>{
  allitems_target(s3params_target, (data) => {
    data.forEach((element) => {
      var params = {
        SourceImage: {
          S3Object: {
            Bucket: "inputtarget",
            Name: `${input_img}`,
          },
        },
        TargetImage: {
          S3Object: {
            Bucket: "cfdstarget",
            Name: `${element}`,
          },
        },
        QualityFilter: "AUTO",
        SimilarityThreshold: 90,
      };
      
    const ans = rekognition.compareFaces(params, function (err, data) {
        if (err) console.log(err, err.stack);
        // an error occurred
        //console.log(data)
        if (data.FaceMatches.length === 1){
          output_img_url = params.TargetImage.S3Object.Name;
        }
        result.push(data.FaceMatches.length)
                
    })
    
  })
      
});

setTimeout(function() {
  if(result.includes(1)){
    res.json({
      output_img_url : output_img_url,
      status: 200,
      input_img_url : input_img
    
    }).status(200)
    // console.log(input_img_url)
    // console.log(result)
    result=[]
  }
  else{
    res.json({
      status : 400
    }).status(400)
    // console.log(input_img_url)
    // console.log(result)
    result=[]

  }

}, 5000);
    
})
app.listen(PORT, () => {
  console.log(`>The server is on the ${PORT}`);
});
