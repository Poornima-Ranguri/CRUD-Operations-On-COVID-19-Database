const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

let database = null;
app.use(express.json());

const databasePath = path.join(__dirname, "covid19India.db");

const initializeDbAndServer = async () => {
  database = await open({
    filename: databasePath,
    driver: sqlite3.Database,
  });

  app.listen(3000, () => {
    console.log("Server is Running at 3000");
  });
};

initializeDbAndServer();

const convertStateObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// API 1

app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`;
  const statesArray = await database.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) =>
      convertStateObjectToResponseObject(eachState)
    )
  );
});

//API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const stateResult = await database.get(getStateQuery);
  response.send(convertStateObjectToResponseObject(stateResult));
});

//API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postStateQuery = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths) 
  VALUES ('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}','${deaths}')`;

  const result = await database.run(postStateQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const resultDistrict = await database.get(getDistrictQuery);
  response.send(convertDistrictToResponseObject(resultDistrict));
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const UpdateQuery = `
            UPDATE district 
            SET 
                district_name='${districtName}',
                state_id=${stateId},
                cases=${cases},
                cured=${cured},
                active=${active},
                deaths=${deaths}
            WHERE district_id=${districtId};`;

  await database.run(UpdateQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT 
            SUM(cases),
            SUM(cured),
            SUM(active),
            SUM(deaths)
        FROM
            district
        WHERE
            state_id = ${stateId};
    `;
  const stats = await database.get(getStateQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 7

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT state_id from district WHERE district_id = ${districtId};`;
  const getDistrictIdResponse = await database.get(getDistrictQuery);

  const getStateNameQuery = `SELECT state_name as stateName FROM state WHERE state_id = ${getDistrictIdResponse.state_id};`;
  const getStateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
}); //sending the required response

module.exports = app;
