const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const cors = require('cors');
require('dotenv').config();

app.use(express.json());
app.use(cors());

const { GoogleSpreadsheet } = require('google-spreadsheet')
const { JWT } = require('google-auth-library');

const saveToGoogleSheets = async (surveyResponses) => {

    const serviceAccountAuth = new JWT({
        email: process.env.EMAIL,
        key: process.env.KEY,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
        ],
    });

    const doc = new GoogleSpreadsheet(process.env.SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    // Fetch the headers (column names) from the Google Sheets document
    await sheet.loadHeaderRow();
    const headers = sheet.headerValues;

    // Create an object to hold the values for each row
    const rowValues = {};

    // Loop through the keys in surveyResponses and map them to the corresponding headers
    for (const key in surveyResponses) {
        if (Object.hasOwnProperty.call(surveyResponses, key)) {
            const value = surveyResponses[key];

            // Find the index of the header in the headers array
            const headerIndex = headers.indexOf(key);

            // If the header exists, add the value to the corresponding key in rowValues
            if (headerIndex !== -1) {
                rowValues[key] = Array.isArray(value) ? value.join(', ') : value;
            }
        }
    }

    // Add the row to the Google Sheets document
    await sheet.addRow(rowValues);
}

app.get('/', (req, res) => {
    res.send("App is up and running!")
})


app.post('/encuesta', (req, res) => {
    try {
        const datos = req.body;
        console.log(req.body)
        saveToGoogleSheets(datos);

        res.status(200).json({
            ok: true,
            message: "Datos recibidos!"
        })

    } catch (error) {
        console.log("Error", error.message);
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
})


app.listen(PORT, () => {
    console.log(`Listening on port 3000 ${PORT}`);
})