const express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    crypto = require('crypto'),
    qrcode = require('qrcode');

//setup code for the server
const app = express();
app.set('view engine', 'ejs');
app.set('port', 3000);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/**
 * main route of the website
 */
app.get("/", (req, res) => {
    res.render('index');
});

/**
 * handles the creation of a qr code
 *  - safe the data on the server
 *  - generate qr code containing reference to the data and redirect to displaying website
 */
app.post("/tour", (req, res) => {
    const body = req.body;
    if (!body) {
        return res.status(400).send("Provide body data!");
    }

    //giving each dataset a unique identifier
    const id = crypto.randomUUID();

    fs.readFile('./src/database.json', (err, dbBuffer) => {
        //initialize empty data in case no database file exists yet
        let currentDbData = [];

        if (!err) {
            //load the content of the database if it exists
            currentDbData = JSON.parse(dbBuffer)
        }

        //generate a qr code for each dataset which contains the uuid
        qrcode.toDataURL(id, (err, url) => {
            if (err) res.status(400).send({ error: "Error while trying to create Qr Code" });

            //append it to the database
            currentDbData.push({ uuid: id, qrcode: url, data: body });

            //overwrite the database file
            fs.writeFile('./src/database.json', JSON.stringify(currentDbData,  null, 2),(err) => {
                if (err) res.status(400).send({ error: "Error while trying to save Qr Code" });

                //redirect to the route which displays data, see below
                res.redirect(`/${id}`);
            });
        })
    });
});

/**
 * displays information of a given id in the database
 */
app.get('/:id', (req, res) => {
    //get the id in the url
    const requestedId = req.params.id;

    fs.readFile('./src/database.json', (err, dbBuffer) => {
        let currentDbData = [];
        if (!err) {
            currentDbData = JSON.parse(dbBuffer)
        }

        //try to find a matching row in the database with given uuid
        let hit = currentDbData.filter(obj => obj.uuid == requestedId)[0];

        if (hit) {
            //render the html page which displays the data
            res.render('qrcode', { src: hit });
        } else {
            res.status(400).send({ error: "Couldn't find a matching dataset!" });
        }
    });

})

app.listen(app.get('port'), () => 'Server Listening...');