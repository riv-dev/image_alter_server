var express = require('express');
var bodyParser = require('body-parser');
var diffMatchPatch = require('./diff_match_patch.js');
var fs = require("fs");



var app = express();

// create application/json parser
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});

var file_path;


// Checks Sync
app.get('/', function (req, res) {
    console.log("Got a GET request for the homepage: ");
    console.log("  host: " + req.query.host);
    //find the file
    var rootpath = decodeURIComponent(req.query.rootpath).replace(/\/$/,'');
    var relative_uri = decodeURIComponent(req.query.relative_uri).replace(/^\//,'').replace(/\/$/,'');
    console.log("  relative: " + relative_uri);
    console.log("  rootpath: "  + rootpath);

    file_path = rootpath + "/" + relative_uri;
    var regex = /\.html/i;

    if(!regex.test(relative_uri)) {
        file_path = file_path + "/index.html";
    }

    console.log("  filepath: " + file_path);

   if(req.query.rootpath && req.query.rootpath.length > 0) {
        var rootpath = decodeURIComponent(req.query.rootpath);
        if (fs.existsSync(file_path)) {
            res.json({ status: "online", synced: "success", rootpath: file_path});
        } else {
            res.json({ status: "online", synced: "error", rootpath: "Does not exist"});
        }
   } else {
       res.json({status: "online", synced: "error", rootpath: "Define rootpath"});
   }
});

// This server only listens to POST requests at "/" url
app.post('/', urlencodedParser, function (req, res) {
   console.log("Got a POST request for the homepage: ");
   console.log("  host: " + req.body.host);
    //find the file
    var rootpath = decodeURIComponent(req.body.rootpath).replace(/\/$/,'');
    var relative_uri = decodeURIComponent(req.body.relative_uri).replace(/^\//,'').replace(/\/$/,'');
    console.log("  relative: " + relative_uri);
    console.log("  rootpath: "  + rootpath);
    console.log("  patch: " + req.body.patch);

    file_path = rootpath + "/" + relative_uri;
    var regex = /\.html/i;

    if(!regex.test(relative_uri)) {
        file_path = file_path + "/index.html";
    }

    //console.log("  filepath: " + file_path);

    var patchedHTML;
    var diffMatchPatchObj = diffMatchPatch.diff_match_patch();

    // Asynchronous read
    if (fs.existsSync(file_path)) { 
        fs.readFile(file_path, function (err, data) {
            if (err) {
                return console.error(err);
            }
            //console.log("Asynchronous read: " + data.toString());
            patchedHTML = diffMatchPatchObj.patch_apply(JSON.parse(req.body.patch), data.toString())[0];
            patchedHTML += "YATAA!!!";

            fs.writeFile(file_path, patchedHTML, function (err) {
                if (err) {
                    return console.log(err);
                }

                console.log("Changed file: " + file_path);
            });

            console.log("Success");
            res.json({status: "success", filepath: file_path, patch: req.body.patch});
        });
    } else {
        console.log("Error");
        res.json({status: "error", message: "File does not exist"});
    }

});

var server = app.listen(9255, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
});