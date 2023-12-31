@app
scheduler

@aws
region eu-west-2
profile default
timeout 30
runtime typescript

@plugins
architect/plugin-typescript

@http
/*
  method any
  src server

@static

@queues
approval-added
  src app/queues/approval-added
schedule-requested
  src app/queues/schedule-requested
schedules-generated
  src app/queues/schedules-generated
schedules-requested
  src app/queues/schedules-requested
country-added
  src app/queues/country-added
document-downloaded
  src app/queues/document-downloaded