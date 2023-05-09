const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dataBasePath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dataBasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("http://localhost3000"));
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};

initializeDbAndServer();

const convertStateDbToResponsiveObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbToResponsiveObject = (dbObject) => {
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

app.get("/states/", async (request, response) => {
  const getStateDetails = `
    select * from state`;
  const details = await db.all(getStateDetails);
  response.send(
    details.map((eachState) => convertStateDbToResponsiveObject(eachState))
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getSingleDetails = `
    select * from state where state_id = ${stateId};`;
  const details = await db.get(getSingleDetails);
  response.send(convertStateDbToResponsiveObject(details));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictDetails = `
  insert into district(district_name,state_id,cases,cured,active,deaths)
  values ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`;
  const details = await db.run(postDistrictDetails);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const IdDetails = `
    select * from district where district_id=${districtId};`;
  const details = await db.get(IdDetails);
  response.send(convertDistrictDbToResponsiveObject(details));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteId = `
    delete from district where district_id=${districtId};`;
  await db.run(deleteId);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateId = `
  update district set district_name='${districtName}',state_id='${stateId}',
  cases = '${cases}',cured='${cured}',active=${active},deaths='${deaths}' where district_id=${districtId};`;
  const details = await db.run(updateId);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDetails = `
    select SUM(cases),SUM(cured),SUM(active),SUM(deaths)
    from district
    where state_id = ${stateId}`;
  const details = await db.get(getDetails);
  response.send({
    totalCases: details["SUM(cases)"],
    totalCured: details["SUM(cured)"],
    totalActive: details["SUM(active)"],
    totalDeaths: details["SUM(deaths)"],
  });
});
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDetails = `
  select state_name from district natural join state where district_id=${districtId};`;
  const details = await db.get(getDetails);
  response.send({ stateName: details.state_name });
});
module.exports = app;
